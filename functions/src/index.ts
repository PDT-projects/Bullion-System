import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const db = admin.firestore();

// ── Gmail transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Approver emails (comma-separated in env) ──────────────────────────────────
const APPROVER_EMAILS = (process.env.APPROVER_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim())
  .filter(Boolean);

const getApprovers = (): string =>
  APPROVER_EMAILS.length > 0 ?
    APPROVER_EMAILS.join(",") :
    process.env.GMAIL_TO || "";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
// TRIGGER 1 — New transaction created
//   • pending_approval  → approval request email to approvers
//   • anything else     → simple notification email
// ══════════════════════════════════════════════════════════════════════════════
export const onTransactionCreated = onDocumentCreated(
  "transactions/{transactionId}",
  async (event) => {
    const data = event.data?.data();
    const firestoreId = event.params.transactionId;
    if (!data) return;

    const txRef = data.transactionId || firestoreId;
    const amount = fmt(data.amount || 0);

    // ── Non-approval path ────────────────────────────────────────────────────
    if (data.approvalStatus !== "pending_approval") {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
          <div style="background:#4f46e5;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">New Transaction Created</h2>
            <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px;">
              Pakistan Detectors ERP System
            </p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;
            border-radius:0 0 8px 8px;">
            <p style="color:#6b7280;margin-top:0;">
              A new transaction has been recorded in your ERP system.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              ${cell("Transaction ID", txRef, true)}
              ${cell("Category", data.mainCategory || "—", false)}
              ${cell("Sub Category", data.subCategory || "—", true)}
              ${cell("Amount", amount, false)}
              ${cell("Date", data.date || "—", true)}
              ${cell("Company/Branch", data.company || "—", false)}
              ${cell("Payment Mode", data.mode || "—", true)}
              ${cell("Description", data.description || "—", false)}
              ${cell("Created By", data.createdBy || "—", true)}
            </table>
            <p style="margin-top:24px;font-size:12px;color:#9ca3af;
              border-top:1px solid #e5e7eb;padding-top:16px;">
              This is an automated notification. Do not reply to this email.
            </p>
          </div>
        </div>`;

      try {
        await transporter.sendMail({
          from: `"Pakistan Detectors ERP" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_TO || "",
          subject: `New Transaction — ${data.mainCategory || ""} | ${amount}`,
          html,
        });
        console.log(`✅ Notification email sent: ${firestoreId}`);
      } catch (err) {
        console.error("❌ Notification email failed:", err);
      }
      return;
    }

    // ── Approval-required path ───────────────────────────────────────────────
    const token = data.approvalToken || "";
    const region = "us-central1";
    const project = process.env.GCLOUD_PROJECT || "";
    const base = `https://${region}-${project}.cloudfunctions.net`;
    const approveUrl = `${base}/approveTransaction?id=${firestoreId}&token=${token}`;
    const rejectUrl = `${base}/rejectTransaction?id=${firestoreId}&token=${token}`;

    const html = `
      <div style="font-family:sans-serif;max-width:640px;margin:auto;
        border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

        <!-- Header -->
        <div style="background:#4f46e5;padding:24px 28px;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">
            ⏳ Transaction Awaiting Your Approval
          </h1>
          <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px;">
            Pakistan Detectors ERP System
          </p>
        </div>

        <!-- Body -->
        <div style="padding:28px;background:#fff;">
          <p style="color:#374151;margin-top:0;">
            A new transaction has been submitted and requires your approval
            before it is processed.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
            ${cell("Transaction ID", `<span style="font-family:monospace;">${txRef}</span>`, true)}
            ${cell("Category", data.mainCategory || "—", false)}
            ${cell("Sub Category", data.subCategory || "—", true)}
            ${cell("Amount",
    `<span style="font-weight:700;font-size:16px;">${amount}</span>`,
    false)}
            ${cell("Date", data.date || "—", true)}
            ${cell("Company/Branch", data.company || "—", false)}
            ${cell("Payment Mode", data.mode || "—", true)}
            ${cell("Note", data.note || "—", false)}
          </table>

          <!-- Action buttons -->
          <p style="color:#374151;font-weight:600;margin-bottom:12px;">
            Please take action:
          </p>
          <div style="margin-bottom:28px;">
            <a href="${approveUrl}"
              style="display:inline-block;padding:14px 32px;background:#16a34a;
                color:#fff;text-decoration:none;border-radius:8px;
                font-weight:700;font-size:15px;margin-right:12px;">
              ✅ Approve
            </a>
            <a href="${rejectUrl}"
              style="display:inline-block;padding:14px 32px;background:#dc2626;
                color:#fff;text-decoration:none;border-radius:8px;
                font-weight:700;font-size:15px;">
              ❌ Reject
            </a>
          </div>

          <div style="background:#fef3c7;border:1px solid #fbbf24;
            border-radius:8px;padding:14px;">
            <p style="margin:0;color:#92400e;font-size:13px;">
              ⚠️ These links are single-use and secure.
              The transaction will remain pending until you act.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Automated notification from Pakistan Detectors ERP. Do not reply.
          </p>
        </div>
      </div>`;

    try {
      await transporter.sendMail({
        from: `"Pakistan Detectors ERP" <${process.env.GMAIL_USER}>`,
        to: getApprovers(),
        subject: `🔔 Approval Required: ${txRef} — ${amount} | ${data.mainCategory || ""}`,
        html,
      });
      console.log(`✅ Approval email sent: ${firestoreId}`);
    } catch (err) {
      console.error("❌ Approval email failed:", err);
    }

    // Create in-app pending notification
    await createNotification({
      type: "transaction_pending_approval",
      title: "⏳ Transaction Pending Approval",
      message: `${txRef} (${data.mainCategory} — ${amount}) is awaiting approval.`,
      transactionId: firestoreId,
      transactionRef: txRef,
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// TRIGGER 2 — Transaction updated → watch approvalStatus changes
// ══════════════════════════════════════════════════════════════════════════════
export const onTransactionUpdated = onDocumentUpdated(
  "transactions/{transactionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const firestoreId = event.params.transactionId;
    if (!before || !after) return;

    const prevStatus = before.approvalStatus;
    const newStatus = after.approvalStatus;
    if (prevStatus === newStatus) return;

    const txRef = after.transactionId || firestoreId;
    const amount = fmt(after.amount || 0);

    // ── Approved ─────────────────────────────────────────────────────────────
    if (newStatus === "approved") {
      await deleteNotificationsForTransaction(firestoreId, [
        "transaction_pending_approval",
      ]);

      await createNotification({
        type: "transaction_approved",
        title: "✅ Transaction Approved",
        message: `${txRef} (${after.mainCategory} — ${amount}) has been approved.`,
        transactionId: firestoreId,
        transactionRef: txRef,
      });

      try {
        await transporter.sendMail({
          from: `"Pakistan Detectors ERP" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_TO || "",
          subject: `✅ Approved: ${txRef} — ${amount}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;">
              <div style="background:#dcfce7;border:1px solid #86efac;
                border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="color:#15803d;margin:0;">✅ Transaction Approved</h2>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                ${cell("Transaction ID", txRef, true)}
                ${cell("Category", after.mainCategory || "—", false)}
                ${cell("Amount", amount, true)}
                ${cell("Approved At", new Date().toLocaleString("en-PK"), false)}
              </table>
            </div>`,
        });
      } catch (err) {
        console.error("❌ Approval confirmation email failed:", err);
      }
    }

    // ── Rejected ─────────────────────────────────────────────────────────────
    if (newStatus === "rejected") {
      await deleteNotificationsForTransaction(firestoreId, [
        "transaction_pending_approval",
      ]);

      await createNotification({
        type: "transaction_rejected",
        title: "❌ Transaction Rejected",
        message:
          `${txRef} (${after.mainCategory} — ${amount}) was rejected. ` +
          `Reason: ${after.rejectionReason || "No reason given"}.`,
        transactionId: firestoreId,
        transactionRef: txRef,
      });

      try {
        await transporter.sendMail({
          from: `"Pakistan Detectors ERP" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_TO || "",
          subject: `❌ Rejected: ${txRef} — ${amount}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;
                border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="color:#dc2626;margin:0;">❌ Transaction Rejected</h2>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                ${cell("Transaction ID", txRef, true)}
                ${cell("Category", after.mainCategory || "—", false)}
                ${cell("Amount", amount, true)}
                ${cell("Reason", after.rejectionReason || "No reason given", false)}
                ${cell("Rejected At", new Date().toLocaleString("en-PK"), true)}
              </table>
            </div>`,
        });
      } catch (err) {
        console.error("❌ Rejection notification email failed:", err);
      }
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// HTTP — Approve via email link
// GET /approveTransaction?id=FIRESTORE_ID&token=TOKEN
// ══════════════════════════════════════════════════════════════════════════════
export const approveTransaction = onRequest(async (req, res) => {
  const {id, token} = req.query as { id?: string; token?: string };

  if (!id || !token) {
    res.status(400).send(errorPage("Invalid Link", "Missing parameters."));
    return;
  }

  try {
    const docRef = db.collection("transactions").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).send(errorPage("Not Found", "Transaction not found."));
      return;
    }

    const data = snap.data()!;

    if (data.approvalStatus === "approved") {
      res.send(
        successPage("Already Approved",
          "This transaction was already approved.", data.transactionId || id)
      );
      return;
    }

    if (data.approvalStatus === "rejected") {
      res.send(
        errorPage("Already Rejected",
          "This transaction was already rejected and cannot be approved.")
      );
      return;
    }

    if (data.approvalToken !== token) {
      res.status(403).send(
        errorPage("Invalid Token", "This link is invalid or has expired.")
      );
      return;
    }

    await docRef.update({
      approvalStatus: "approved",
      approvedAt: new Date().toISOString(),
      approvalToken: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Approved via email link: ${id}`);
    res.send(
      successPage("Transaction Approved!",
        "The transaction has been approved and is now active.",
        data.transactionId || id)
    );
  } catch (err) {
    console.error("approveTransaction error:", err);
    res.status(500).send(errorPage("Error", "Something went wrong."));
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// HTTP — Reject via email link
// GET  /rejectTransaction?id=FIRESTORE_ID&token=TOKEN  → shows form
// POST /rejectTransaction?id=FIRESTORE_ID&token=TOKEN  → processes rejection
// ══════════════════════════════════════════════════════════════════════════════
export const rejectTransaction = onRequest(async (req, res) => {
  const {id, token} = req.query as { id?: string; token?: string };

  if (!id || !token) {
    res.status(400).send(errorPage("Invalid Link", "Missing parameters."));
    return;
  }

  try {
    const docRef = db.collection("transactions").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).send(errorPage("Not Found", "Transaction not found."));
      return;
    }

    const data = snap.data()!;

    if (data.approvalStatus === "rejected") {
      res.send(errorPage("Already Rejected", "This transaction was already rejected."));
      return;
    }

    if (data.approvalStatus === "approved") {
      res.send(
        errorPage("Already Approved",
          "This transaction was already approved and cannot be rejected.")
      );
      return;
    }

    if (data.approvalToken !== token) {
      res.status(403).send(
        errorPage("Invalid Token", "This link is invalid or has expired.")
      );
      return;
    }

    // GET → show rejection form
    if (req.method === "GET") {
      res.send(rejectFormPage(id, token, data.transactionId || id));
      return;
    }

    // POST → process rejection
    const reason = (req.body?.reason as string) || "Rejected by admin";

    await docRef.update({
      approvalStatus: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      approvalToken: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`❌ Rejected via email link: ${id}`);
    res.send(
      errorPage("Transaction Rejected",
        `The transaction has been rejected. Reason: ${reason}`)
    );
  } catch (err) {
    console.error("rejectTransaction error:", err);
    res.status(500).send(errorPage("Error", "Something went wrong."));
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// HTML page helpers
// ══════════════════════════════════════════════════════════════════════════════
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
      .ref{font-family:monospace;background:#fef2f2;padding:6px 12px;
        border-radius:6px;color:#dc2626;font-size:13px;margin-bottom:20px;
        display:inline-block;}
      textarea{width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;
        font-size:14px;resize:vertical;min-height:80px;
        box-sizing:border-box;margin-bottom:16px;}
      button{width:100%;padding:14px;background:#dc2626;color:#fff;border:none;
        border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;}
      button:hover{background:#b91c1c;}
    </style>
  </head><body>
    <div class="card">
      <h1>❌ Reject Transaction</h1>
      <p>You are about to reject this transaction:</p>
      <div class="ref">${txRef}</div>
      <form method="POST">
        <input type="hidden" name="id"    value="${id}">
        <input type="hidden" name="token" value="${token}">
        <textarea name="reason"
          placeholder="Enter reason for rejection (optional)"></textarea>
        <button type="submit">Confirm Rejection</button>
      </form>
    </div>
  </body></html>`;
}
