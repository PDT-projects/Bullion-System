import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const APPROVER_EMAILS = (process.env.APPROVER_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim())
  .filter(Boolean);

const getApprovers = (): string =>
  APPROVER_EMAILS.length > 0
    ? APPROVER_EMAILS.join(",")
    : process.env.GMAIL_TO || "";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(n);

const cell = (label: string, value: string, bg: boolean) => `
  <tr style="background:${bg ? "#f9fafb" : "#ffffff"};">
    <td style="padding:10px 14px;font-weight:600;color:#374151;
      width:40%;border:1px solid #e5e7eb;">${label}</td>
    <td style="padding:10px 14px;color:#111827;
      border:1px solid #e5e7eb;">${value}</td>
  </tr>`;

async function createNotification(data: {
  type: string;
  title: string;
  message: string;
  transactionId?: string;
  transactionRef?: string;
}) {
  await db.collection("appNotifications").add({
    ...data,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

async function deleteNotificationsForTransaction(
  firestoreId: string,
  types?: string[]
) {
  const snap = await db
    .collection("appNotifications")
    .where("transactionId", "==", firestoreId)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => {
    if (!types || types.includes(d.data().type)) batch.delete(d.ref);
  });
  await batch.commit();
}

// Sub-categories that classify a Loan transaction as money going OUT
// (requires approval and triggers a bank deduction on approval)
const LOAN_GIVEN_SUB_CATEGORIES = new Set([
  "Loan given",
  "Official Loan",
  "Personal loan",
  "Other loan - Full",
  "Other loan - Partial",
  "Loan paid to employee",
]);

/**
 * Apply deferred bank balance change for transactions that required approval.
 *
 * Background:
 *   When a Cash Outflow / Loan-given transaction is created with
 *   approvalStatus = 'pending_approval', the frontend deliberately does NOT
 *   touch the bank balance. This means a rejection leaves liquidity fully
 *   intact. Only on approval do we execute the deduction here, server-side,
 *   so there is no race condition and no need for a manual rollback.
 *
 * @param after  - Firestore document data after the update
 */
async function applyDeferredBankBalanceOnApproval(
  after: FirebaseFirestore.DocumentData
): Promise<void> {
  // Only applies to Bank-mode transactions
  if (after.mode !== "Bank" || !after.bankId) return;

  const isOutflow =
    after.mainCategory === "Cash Outflow" ||
    (after.mainCategory === "Loan" &&
      LOAN_GIVEN_SUB_CATEGORIES.has(after.subCategory));

  // Safety: Cash Inflow approvals are 'not_required', so this path should
  // never be reached for inflows — but handle gracefully just in case.
  const isInflow = after.mainCategory === "Cash Inflow";

  if (!isOutflow && !isInflow) return; // Unrecognised category — skip

  try {
    const bankRef  = db.collection("banks").doc(after.bankId);
    const bankSnap = await bankRef.get();

    if (!bankSnap.exists) {
      console.warn(`⚠️ Bank ${after.bankId} not found — skipping balance update`);
      return;
    }

    const currentBalance = bankSnap.data()!.balance ?? 0;
    const txAmount       = after.amount ?? 0;
    const newBalance     = isOutflow
      ? currentBalance - txAmount  // money left the account
      : currentBalance + txAmount; // money entered the account

    await bankRef.update({
      balance:   newBalance,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `✅ Deferred bank balance applied on approval: ` +
      `bank=${after.bankId}, was=${currentBalance}, now=${newBalance} ` +
      `(${isOutflow ? "deducted" : "added"} ${txAmount})`
    );
  } catch (err) {
    // Non-fatal — log for manual reconciliation; approval notification still fires.
    console.error("❌ Deferred bank balance update failed:", err);
  }
}

// =============================================================================
// TRIGGER 1 — New transaction created
// =============================================================================
export const onTransactionCreated = onDocumentCreated(
  "transactions/{transactionId}",
  async (event) => {
    const data = event.data?.data();
    const firestoreId = event.params.transactionId;
    if (!data) return;

    const txRef  = data.transactionId || firestoreId;
    const amount = fmt(data.amount || 0);

    // ── Cash Inflow / Loan received → simple notification email ───────────
    if (data.approvalStatus !== "pending_approval") {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;
          margin:auto;padding:24px;">
          <div style="background:#2d2d2d;padding:20px 24px;
            border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">
              New Transaction Recorded
            </h2>
            <p style="color:#b0b0b0;margin:4px 0 0;font-size:14px;">
              Bullion Electronics ERP System
            </p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;
            padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#6b7280;margin-top:0;">
              A new <strong>${data.mainCategory}</strong> transaction
              has been recorded in the ERP system.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              ${cell("Transaction ID", txRef, true)}
              ${cell("Category",       data.mainCategory  || "—", false)}
              ${cell("Sub Category",   data.subCategory   || "—", true)}
              ${cell("Amount",         amount,                    false)}
              ${cell("Date",           data.date          || "—", true)}
              ${cell("Company/Branch", data.company       || "—", false)}
              ${cell("Payment Mode",   data.mode          || "—", true)}
              ${cell("Description",    data.note          || "—", false)}
              ${cell("Created By",     data.paidBy        || "—", true)}
            </table>
            <p style="margin-top:24px;font-size:12px;color:#9ca3af;
              border-top:1px solid #e5e7eb;padding-top:16px;">
              This is an automated notification. Do not reply to this email.
            </p>
          </div>
        </div>`;

      try {
        await transporter.sendMail({
          from:    `"Bullion Electronics ERP" <${process.env.GMAIL_USER}>`,
          to:      process.env.GMAIL_TO || "",
          subject: `📥 New ${data.mainCategory}: ${txRef} — ${amount}`,
          html,
        });
        console.log(`✅ Notification email sent (no approval): ${firestoreId}`);
      } catch (err) {
        console.error("❌ Notification email failed:", err);
      }
      return;
    }

    // ── Cash Outflow / Loan given → approval email ─────────────────────────
    // NOTE: Bank balance is NOT touched here. It will only be updated in
    // onTransactionUpdated when approvalStatus changes to 'approved'.
    // A rejection hard-deletes the document, leaving liquidity unchanged.
    const token   = data.approvalToken || "";
    const region  = "us-central1";
    const project = process.env.GCLOUD_PROJECT || "";
    const base    = `https://${region}-${project}.cloudfunctions.net`;
    const approveUrl = `${base}/approveTransaction?id=${firestoreId}&token=${token}`;
    const rejectUrl  = `${base}/rejectTransaction?id=${firestoreId}&token=${token}`;

    const html = `
      <div style="font-family:sans-serif;max-width:640px;margin:auto;
        border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#2d2d2d;padding:24px 28px;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">
            ⏳ Transaction Awaiting Your Approval
          </h1>
          <p style="color:#b0b0b0;margin:6px 0 0;font-size:13px;">
            Bullion Electronics ERP System
          </p>
        </div>
        <div style="padding:28px;background:#fff;">
          <p style="color:#374151;margin-top:0;">
            A new <strong>${data.mainCategory}</strong> transaction has been
            submitted and requires your approval before it is processed.
          </p>
          <table style="width:100%;border-collapse:collapse;
            margin:20px 0;font-size:14px;">
            ${cell("Transaction ID",
              `<span style="font-family:monospace;">${txRef}</span>`, true)}
            ${cell("Category",       data.mainCategory || "—", false)}
            ${cell("Sub Category",   data.subCategory  || "—", true)}
            ${cell("Amount",
              `<span style="font-weight:700;font-size:16px;">${amount}</span>`,
              false)}
            ${cell("Date",           data.date         || "—", true)}
            ${cell("Company/Branch", data.company      || "—", false)}
            ${cell("Payment Mode",   data.mode         || "—", true)}
            ${cell("Note",           data.note         || "—", false)}
          </table>
          <p style="color:#374151;font-weight:600;margin-bottom:12px;">
            Please take action:
          </p>
          <div style="margin-bottom:28px;">
            <a href="${approveUrl}"
              style="display:inline-block;padding:14px 32px;
                background:#16a34a;color:#fff;text-decoration:none;
                border-radius:8px;font-weight:700;font-size:15px;
                margin-right:12px;">
              ✅ Approve
            </a>
            <a href="${rejectUrl}"
              style="display:inline-block;padding:14px 32px;
                background:#dc2626;color:#fff;text-decoration:none;
                border-radius:8px;font-weight:700;font-size:15px;">
              ❌ Reject
            </a>
          </div>
          <div style="background:#fef3c7;border:1px solid #fbbf24;
            border-radius:8px;padding:14px;">
            <p style="margin:0;color:#92400e;font-size:13px;">
              ⚠️ These links are single-use and secure.
              The transaction will remain pending until you act.
              Rejecting will permanently cancel and delete the transaction —
              no financial changes will be made.
            </p>
          </div>
        </div>
        <div style="padding:16px 28px;background:#f9fafb;
          border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Automated notification from Bullion Electronics ERP. Do not reply.
          </p>
        </div>
      </div>`;

    try {
      await transporter.sendMail({
        from:    `"Bullion Electronics ERP" <${process.env.GMAIL_USER}>`,
        to:      getApprovers(),
        subject: `🔔 Approval Required: ${txRef} — ${amount} | ${data.mainCategory || ""}`,
        html,
      });
      console.log(`✅ Approval email sent: ${firestoreId}`);
    } catch (err) {
      console.error("❌ Approval email failed:", err);
    }
  }
);

// =============================================================================
// TRIGGER 2 — Transaction updated → watch approvalStatus changes (approved only)
//
// Key behaviour:
//   approved  → apply deferred bank balance deduction, send confirmation email
//   rejected  → hard-delete now happens in the HTTP handler (rejectTransaction),
//               so this trigger only fires for 'approved' status changes.
//               Bank balance is NOT touched on rejection — the document is simply
//               gone, leaving liquidity exactly as it was.
// =============================================================================
export const onTransactionUpdated = onDocumentUpdated(
  "transactions/{transactionId}",
  async (event) => {
    const before      = event.data?.before.data();
    const after       = event.data?.after.data();
    const firestoreId = event.params.transactionId;
    if (!before || !after) return;

    const prevStatus = before.approvalStatus;
    const newStatus  = after.approvalStatus;
    if (prevStatus === newStatus) return;

    const txRef  = after.transactionId || firestoreId;
    const amount = fmt(after.amount || 0);

    // ── Approved ───────────────────────────────────────────────────────────
    if (newStatus === "approved") {
      // 1. Clean up pending-approval notification
      await deleteNotificationsForTransaction(firestoreId, [
        "transaction_pending_approval",
      ]);

      // 2. Deferred bank balance update — only now that the admin approved.
      //    If the payment mode is Bank, we deduct (outflow) or add (inflow).
      //    Cash / Cheque transactions don't need a balance update here.
      await applyDeferredBankBalanceOnApproval(after);

      // 3. In-app notification
      await createNotification({
        type:           "transaction_approved",
        title:          "✅ Transaction Approved",
        message:        `${txRef} (${after.mainCategory} — ${amount}) has been approved.`,
        transactionId:  firestoreId,
        transactionRef: txRef,
      });

      // 4. Confirmation email to internal team
      try {
        await transporter.sendMail({
          from:    `"Bullion Electronics ERP" <${process.env.GMAIL_USER}>`,
          to:      process.env.GMAIL_TO || "",
          subject: `✅ Approved: ${txRef} — ${amount}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;
              margin:auto;padding:24px;">
              <div style="background:#dcfce7;border:1px solid #86efac;
                border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="color:#15803d;margin:0;">✅ Transaction Approved</h2>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                ${cell("Transaction ID", txRef,                     true)}
                ${cell("Category",       after.mainCategory || "—", false)}
                ${cell("Amount",         amount,                    true)}
                ${cell("Payment Mode",   after.mode         || "—", false)}
                ${cell("Approved At",
                  new Date().toLocaleString("en-PK"),               true)}
              </table>
              ${after.mode === "Bank" ? `
              <div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;
                border-radius:8px;padding:12px 14px;">
                <p style="margin:0;color:#1e40af;font-size:13px;">
                  💳 Bank balance has been updated to reflect this transaction.
                </p>
              </div>` : ""}
            </div>`,
        });
      } catch (err) {
        console.error("❌ Approval confirmation email failed:", err);
      }
    }
  }
);

// =============================================================================
// HTTP — Approve via email link
// =============================================================================
export const approveTransaction = onRequest(async (req, res) => {
  const { id, token } = req.query as { id?: string; token?: string };
  if (!id || !token) {
    res.status(400).send(errorPage("Invalid Link", "Missing parameters."));
    return;
  }
  try {
    const docRef = db.collection("transactions").doc(id);
    const snap   = await docRef.get();
    if (!snap.exists) {
      res.status(404).send(errorPage("Not Found", "Transaction not found."));
      return;
    }
    const data = snap.data()!;
    if (data.approvalStatus === "approved") {
      res.send(successPage("Already Approved",
        "This transaction was already approved.", data.transactionId || id));
      return;
    }
    if (data.approvalToken !== token) {
      res.status(403).send(
        errorPage("Invalid Token", "This link is invalid or has expired."));
      return;
    }
    await docRef.update({
      approvalStatus: "approved",
      approvedAt:     new Date().toISOString(),
      approvalToken:  admin.firestore.FieldValue.delete(),
      updatedAt:      new Date().toISOString(),
    });
    // onTransactionUpdated fires next and applies the deferred bank balance.
    console.log(`✅ Approved via email link: ${id}`);
    res.send(successPage("Transaction Approved!",
      "The transaction has been approved and is now active.",
      data.transactionId || id));
  } catch (err) {
    console.error("approveTransaction error:", err);
    res.status(500).send(errorPage("Error", "Something went wrong."));
  }
});

// =============================================================================
// HTTP — Reject via email link
//
// BEHAVIOUR:
//   • Hard-deletes the Firestore document.
//   • Makes ZERO financial changes — no bank balance, no cash, nothing.
//   • Because the frontend never applied a bank deduction for pending_approval
//     transactions, the deletion is a complete no-op financially.
//   • Cleans up related in-app notifications.
// =============================================================================
export const rejectTransaction = onRequest(async (req, res) => {
  const { id, token } = req.query as { id?: string; token?: string };
  if (!id || !token) {
    res.status(400).send(errorPage("Invalid Link", "Missing parameters."));
    return;
  }
  try {
    const docRef = db.collection("transactions").doc(id);
    const snap   = await docRef.get();

    // Already deleted
    if (!snap.exists) {
      res.send(errorPage(
        "Already Removed",
        "This transaction no longer exists — it may have already been rejected and deleted."
      ));
      return;
    }

    const data = snap.data()!;

    // Already approved — cannot reject
    if (data.approvalStatus === "approved") {
      res.send(errorPage(
        "Already Approved",
        "This transaction was already approved and cannot be rejected."
      ));
      return;
    }

    // Invalid token
    if (data.approvalToken !== token) {
      res.status(403).send(
        errorPage("Invalid Token", "This link is invalid or has expired."));
      return;
    }

    // Show reason form on GET
    if (req.method === "GET") {
      res.send(rejectFormPage(id, token, data.transactionId || id));
      return;
    }

    // ── POST: hard-delete the transaction ─────────────────────────────────
    // Financial note: because the bank balance was NOT updated at creation
    // for pending_approval transactions, this delete is purely a record
    // removal — liquidity is untouched.
    const txRef  = data.transactionId || id;
    const amount = fmt(data.amount || 0);
    const reason = (req.body?.reason as string)?.trim() || "Rejected by admin";

    // 1. Delete the transaction document
    await docRef.delete();
    console.log(`❌ Rejected & deleted via email link: ${id} (no financial changes)`);

    // 2. Clean up notifications + add rejected in-app notification
    const notifSnap = await db
      .collection("appNotifications")
      .where("transactionId", "==", id)
      .get();

    const batch = db.batch();
    notifSnap.docs.forEach((d) => batch.delete(d.ref));

    const notifRef = db.collection("appNotifications").doc();
    batch.set(notifRef, {
      type:           "transaction_rejected",
      title:          "❌ Transaction Rejected & Removed",
      message:        `${txRef} (${data.mainCategory} — ${amount}) was rejected and permanently deleted. Reason: ${reason}. No financial changes were made.`,
      transactionId:  id,
      transactionRef: txRef,
      isRead:         false,
      createdAt:      new Date().toISOString(),
    });

    await batch.commit();

    // 3. Confirmation email to internal team
    try {
      await transporter.sendMail({
        from:    `"Bullion Electronics ERP" <${process.env.GMAIL_USER}>`,
        to:      process.env.GMAIL_TO || "",
        subject: `❌ Rejected & Deleted: ${txRef} — ${amount}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;
            margin:auto;padding:24px;">
            <div style="background:#fef2f2;border:1px solid #fecaca;
              border-radius:8px;padding:16px;margin-bottom:20px;">
              <h2 style="color:#dc2626;margin:0;">❌ Transaction Rejected & Deleted</h2>
              <p style="color:#7f1d1d;margin:8px 0 0;font-size:13px;">
                This transaction has been permanently removed.
                No financial changes (bank balance, cash) were made.
              </p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${cell("Transaction ID", txRef,                     true)}
              ${cell("Category",       data.mainCategory || "—", false)}
              ${cell("Amount",         amount,                    true)}
              ${cell("Reason",         reason,                    false)}
              ${cell("Rejected At",
                new Date().toLocaleString("en-PK"),               true)}
            </table>
          </div>`,
      });
    } catch (err) {
      console.error("❌ Rejection confirmation email failed:", err);
    }

    res.send(rejectedPage(txRef, reason));
  } catch (err) {
    console.error("rejectTransaction error:", err);
    res.status(500).send(errorPage("Error", "Something went wrong."));
  }
});

// =============================================================================
// User deletion trigger - Delete Firebase Auth user when Firestore user doc is deleted
// =============================================================================
export const onUserDeleted = onDocumentDeleted(
  "users/{userId}",
  async (event: any) => {
    const userId = event.params.userId;
    try {
      await admin.auth().deleteUser(userId);
      console.log("Firebase Auth user " + userId + " deleted after Firestore deletion");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.log("Firebase Auth user " + userId + " already deleted");
      } else {
        console.error("Failed to delete Firebase Auth user " + userId + ":", error);
      }
    }
  }
);

// =============================================================================
// TRIGGER: Invoice PDF ready → send email with PDF attachment
//
// WHY onDocumentUpdated instead of onDocumentCreated:
//   The frontend flow is intentionally two-step:
//     1. createInvoice()     → Firestore doc written WITHOUT pdfUrl
//     2. generateAndSavePdf() → PDF uploaded to Storage, pdfUrl written back
//
//   If we used onDocumentCreated, pdfUrl would always be missing at that
//   moment and the email would be skipped every time.
//
//   This trigger watches for the exact transition:
//     before.pdfUrl = absent/empty  →  after.pdfUrl = populated
//   ...which fires precisely once per invoice, when the PDF is ready.
//   The email then downloads the PDF from Storage and sends it as an
//   attachment to acctsdetectors4563@gmail.com.
// =============================================================================
export const onInvoicePdfReady = onDocumentUpdated(
  "invoices/{invoiceId}",
  async (event) => {
    const before    = event.data?.before.data();
    const after     = event.data?.after.data();
    const invoiceId = event.params.invoiceId;

    if (!before || !after) return;

    // Guard: only proceed when pdfUrl transitions from absent → present.
    // This ensures the trigger fires exactly once per invoice and ignores
    // all other field updates (status changes, delivery updates, etc.).
    const hadPdf = !!(before.pdfUrl);
    const hasPdf = !!(after.pdfUrl);

    if (hadPdf || !hasPdf) {
      // Either pdfUrl was already there (not a new PDF), or it's still missing
      return;
    }

    console.log(`📄 pdfUrl detected for invoice ${invoiceId} — preparing email`);

    const invoiceNumber = after.invoiceNumber || invoiceId;
    const customerName  = after.customerName  || "Customer";
    const totalAmount   = fmt(after.totalAmount || 0);
    const salesperson   = after.salesperson   || "—";
    const status        = after.status        || "Unpaid";
    const date          = after.date          || new Date().toISOString().slice(0, 10);
    const createdBy     = after.createdBy     || "Admin";

    try {
      // 1. Download PDF from Firebase Storage using the real invoice ID.
      //    Path must match what InvoiceFirebaseService.uploadInvoicePdf() writes:
      //    invoices/pdfs/{invoiceId}.pdf
      const bucket      = admin.storage().bucket();
      const pdfFileName = `invoices/pdfs/${invoiceId}.pdf`;
      const [pdfBuffer] = await bucket.file(pdfFileName).download();
      console.log(`✅ PDF downloaded from Storage for email: ${invoiceId}`);

      // 2. Build HTML email body (style consistent with transaction emails)
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
          <div style="background:#10b981;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">
              📄 New Invoice Created
            </h2>
            <p style="color:#d1fae5;margin:4px 0 0;font-size:14px;">
              Bullion Electronics ERP System
            </p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;
            padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#6b7280;margin-top:0;">
              A new invoice has been created. PDF is attached to this email.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              ${cell("Invoice #",    invoiceNumber, true)}
              ${cell("Date",         date,          false)}
              ${cell("Customer",     customerName,  true)}
              ${cell("Salesperson",  salesperson,   false)}
              ${cell("Status",       status,        true)}
              ${cell("Total Amount", totalAmount,   false)}
              ${cell("Created By",   createdBy,     true)}
            </table>
            <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;
              padding-top:16px;margin-top:24px;">
              Automated notification from Bullion Electronics ERP. PDF attached.
            </p>
          </div>
        </div>`;

      // 3. Send email with PDF attached
      await transporter.sendMail({
        from:    `"Bullion Electronics ERP" <${process.env.GMAIL_USER}>`,
        to:      "acctsdetectors4563@gmail.com",
        subject: `📄 New Invoice: ${invoiceNumber} — ${totalAmount}`,
        html,
        attachments: [{
          filename: `${invoiceNumber}.pdf`,
          content:  pdfBuffer,
        }],
      });

      console.log(`✅ Invoice email + PDF sent to acctsdetectors4563@gmail.com: ${invoiceId}`);

      // 4. In-app notification
      await createNotification({
        type:           "invoice_created",
        title:          "📄 New Invoice Created",
        message:        `${invoiceNumber} (${totalAmount}) by ${createdBy}`,
        transactionId:  invoiceId,
        transactionRef: invoiceNumber,
      });

    } catch (err) {
      console.error(`❌ Invoice email/PDF failed for ${invoiceId}:`, err);
    }
  }
);

// =============================================================================
// HTML helpers
// =============================================================================
function successPage(title: string, message: string, txRef: string): string {
  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;
        justify-content:center;min-height:100vh;margin:0;background:#f0fdf4;}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;
        width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);
        border:1px solid #bbf7d0;}
      .icon{font-size:64px;margin-bottom:16px;}
      h1{color:#15803d;font-size:24px;margin:0 0 12px;}
      p{color:#374151;margin:0 0 8px;}
      .ref{font-family:monospace;background:#f0fdf4;padding:6px 12px;
        border-radius:6px;color:#166534;font-size:14px;margin-top:12px;
        display:inline-block;}
    </style>
  </head><body>
    <div class="card">
      <div class="icon">✅</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="ref">${txRef}</div>
    </div>
  </body></html>`;
}

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;
        justify-content:center;min-height:100vh;margin:0;background:#fef2f2;}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;
        width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);
        border:1px solid #fecaca;}
      .icon{font-size:64px;margin-bottom:16px;}
      h1{color:#dc2626;font-size:24px;margin:0 0 12px;}
      p{color:#374151;margin:0;}
    </style>
  </head><body>
    <div class="card">
      <div class="icon">❌</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body></html>`;
}

function rejectedPage(txRef: string, reason: string): string {
  return `<!DOCTYPE html><html><head>
    <title>Transaction Rejected</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;
        justify-content:center;min-height:100vh;margin:0;background:#fef2f2;}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;
        width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);
        border:1px solid #fecaca;}
      .icon{font-size:64px;margin-bottom:16px;}
      h1{color:#dc2626;font-size:24px;margin:0 0 8px;}
      .sub{color:#6b7280;font-size:14px;margin:0 0 20px;}
      .ref{font-family:monospace;background:#fef2f2;padding:6px 12px;
        border-radius:6px;color:#dc2626;font-size:14px;display:inline-block;
        margin-bottom:16px;}
      .reason{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
        padding:12px 16px;color:#374151;font-size:14px;text-align:left;}
      .note{margin-top:20px;font-size:12px;color:#9ca3af;}
    </style>
  </head><body>
    <div class="card">
      <div class="icon">❌</div>
      <h1>Transaction Rejected & Deleted</h1>
      <p class="sub">This transaction has been permanently removed.<br>No financial changes were made.</p>
      <div class="ref">${txRef}</div>
      <div class="reason"><strong>Reason:</strong> ${reason}</div>
      <p class="note">The ERP system has been notified automatically.</p>
    </div>
  </body></html>`;
}

function rejectFormPage(id: string, token: string, txRef: string): string {
  return `<!DOCTYPE html><html><head>
    <title>Reject Transaction</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;
        justify-content:center;min-height:100vh;margin:0;background:#fef2f2;}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;
        width:90%;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #fecaca;}
      h1{color:#dc2626;font-size:22px;margin:0 0 8px;}
      p{color:#6b7280;margin:0 0 20px;font-size:14px;}
      .warning{background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;
        padding:12px 14px;margin-bottom:20px;font-size:13px;color:#92400e;}
      .safe{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;
        padding:12px 14px;margin-bottom:20px;font-size:13px;color:#166534;}
      .ref{font-family:monospace;background:#fef2f2;padding:6px 12px;
        border-radius:6px;color:#dc2626;font-size:13px;margin-bottom:20px;
        display:inline-block;}
      textarea{width:100%;padding:12px;border:1px solid #d1d5db;
        border-radius:8px;font-size:14px;resize:vertical;min-height:80px;
        box-sizing:border-box;margin-bottom:16px;}
      button{width:100%;padding:14px;background:#dc2626;color:#fff;
        border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;}
      button:hover{background:#b91c1c;}
    </style>
  </head><body>
    <div class="card">
      <h1>❌ Reject Transaction</h1>
      <p>You are about to permanently cancel this transaction:</p>
      <div class="ref">${txRef}</div>
      <div class="warning">
        ⚠️ This will <strong>permanently delete</strong> the transaction record.
      </div>
      <div class="safe">
        ✅ <strong>No financial changes will be made.</strong>
        Bank balances and cash amounts remain exactly as they were —
        this transaction was never applied to your accounts.
      </div>
      <form method="POST">
        <input type="hidden" name="id"    value="${id}">
        <input type="hidden" name="token" value="${token}">
        <textarea name="reason"
          placeholder="Enter reason for rejection (optional)"></textarea>
        <button type="submit">Confirm Rejection & Delete</button>
      </form>
    </div>
  </body></html>`;
}