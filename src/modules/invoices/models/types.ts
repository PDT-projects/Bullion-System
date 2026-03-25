// Invoice Module - Firebase Service Layer
// All Firestore + Firebase Storage operations for invoices
// Change: added uploadInvoicePdf() and savePdfUrl() for PDF → Storage → Firestore URL flow

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc,
} from 'firebase/firestore';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db } from '../../../api/firebase/firebase';
import { Invoice, CreateInvoiceDTO } from './types';

const COLLECTION         = 'invoices';
const COUNTER_COLLECTION = 'invoiceCounters';
const PDF_STORAGE_PATH   = 'invoices/pdfs'; // Firebase Storage folder

const storage = getStorage();

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function docToInvoice(d: any): Invoice {
  const data = d.data ? d.data() : d;
  return {
    id:                     d.id,
    invoiceNumber:          data.invoiceNumber          || '',
    date:                   data.date                   || '',
    customerName:           data.customerName           || '',
    customerPhone:          data.customerPhone          || '',
    customerPhone2:         data.customerPhone2,
    customerCNIC:           data.customerCNIC           || '',
    customerProvince:       data.customerProvince       || '',
    customerCity:           data.customerCity           || '',
    customerAddress:        data.customerAddress,
    warrantyLocation:       data.warrantyLocation,
    products:               data.products               || [],
    exchangeWarrantyNote:   data.exchangeWarrantyNote   || '',
    deliveryStatus:         data.deliveryStatus         || 'Self-collect',
    deliveryReceivedStatus: data.deliveryReceivedStatus || 'Pending',
    totalAmount:            data.totalAmount            || 0,
    status:                 data.status                 || 'Unpaid',
    salesperson:            data.salesperson,
    salespersonLocation:    data.salespersonLocation,
    clientDealBy:           data.clientDealBy,
    referralBy:             data.referralBy,
    createdBy:              data.createdBy,
    paymentMode:            data.paymentMode,
    bankId:                 data.bankId,
    bankName:               data.bankName,
    bankAccountNumber:      data.bankAccountNumber,
    paymentStatus:          data.paymentStatus,
    paidAmount:             data.paidAmount,
    remainingAmount:        data.remainingAmount,
    collectionMethod:       data.collectionMethod,
    deductionCharges:       data.deductionCharges       || 0,
    digitalStamp:           data.digitalStamp,
    imageUrl:               data.imageUrl,
    pdfUrl:                 data.pdfUrl,              // ← new
    paidBy:                 data.paidBy,
    paidTo:                 data.paidTo,
    productLocation:        data.productLocation,
    createdAt:              data.createdAt,
    updatedAt:              data.updatedAt,
  } as Invoice;
}

export class InvoiceFirebaseService {

  // ── Generate unique invoice number (INV-DDMMYY-NNN) ──────────────────────
  static async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const key = `${dd}${mm}${yy}`;
    const ref = doc(db, COUNTER_COLLECTION, key);

    try {
      const snap = await getDoc(ref);
      const next = snap.exists() ? (snap.data().count || 0) + 1 : 1;
      await (snap.exists()
        ? updateDoc(ref, { count: next })
        : (await addDoc(collection(db, COUNTER_COLLECTION), {}),
           updateDoc(ref, { count: next }))
      );
      return `INV-${key}-${String(next).padStart(3, '0')}`;
    } catch {
      return `INV-${key}-${String(Date.now()).slice(-3)}`;
    }
  }

  // ── Fetch all invoices ───────────────────────────────────────────────────
  static async fetchAllInvoices(): Promise<Invoice[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const invoices = snapshot.docs.map(docToInvoice);
      invoices.sort((a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
      console.log(`✅ Fetched ${invoices.length} invoices`);
      return invoices;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices from Firestore');
    }
  }

  // ── Fetch single invoice ─────────────────────────────────────────────────
  static async fetchInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (!snap.exists()) return null;
      return docToInvoice(snap);
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      throw new Error('Failed to fetch invoice from Firestore');
    }
  }

  // ── Create invoice ───────────────────────────────────────────────────────
  static async createInvoice(dto: Omit<Invoice, 'id'>): Promise<Invoice> {
    try {
      const now  = new Date().toISOString();
      const data = stripUndefined({ ...dto, createdAt: now, updatedAt: now });
      const ref  = await addDoc(collection(db, COLLECTION), data);
      console.log('✅ Invoice created:', ref.id);
      return { ...dto, id: ref.id, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw new Error('Failed to create invoice in Firestore');
    }
  }

  // ── Update invoice ───────────────────────────────────────────────────────
  static async updateInvoice(id: string, dto: Partial<Omit<Invoice, 'id'>>): Promise<void> {
    try {
      const data = stripUndefined({ ...dto, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, COLLECTION, id), data);
      console.log('✅ Invoice updated:', id);
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw new Error('Failed to update invoice in Firestore');
    }
  }

  // ── Delete invoice ───────────────────────────────────────────────────────
  static async deleteInvoice(id: string): Promise<void> {
    try {
      // Also delete the PDF from Storage if it exists
      try {
        const pdfRef = storageRef(storage, `${PDF_STORAGE_PATH}/${id}.pdf`);
        await deleteObject(pdfRef);
        console.log('✅ PDF deleted from Storage:', id);
      } catch {
        // PDF may not exist — ignore
      }
      await deleteDoc(doc(db, COLLECTION, id));
      console.log('✅ Invoice deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      throw new Error('Failed to delete invoice from Firestore');
    }
  }

  // ── Upload PDF to Firebase Storage ──────────────────────────────────────
  // Path: invoices/pdfs/{invoiceId}.pdf
  // Returns the public download URL.
  static async uploadInvoicePdf(invoiceId: string, pdfBlob: Blob): Promise<string> {
    try {
      console.log('🔥 Uploading invoice PDF to Storage:', invoiceId);
      const ref  = storageRef(storage, `${PDF_STORAGE_PATH}/${invoiceId}.pdf`);
      const snap = await uploadBytes(ref, pdfBlob, { contentType: 'application/pdf' });
      const url  = await getDownloadURL(snap.ref);
      console.log('✅ PDF uploaded:', url);
      return url;
    } catch (error) {
      console.error('❌ Error uploading PDF:', error);
      throw new Error('Failed to upload PDF to Firebase Storage');
    }
  }

  // ── Save PDF URL back to Firestore invoice doc ───────────────────────────
  static async savePdfUrl(invoiceId: string, pdfUrl: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, invoiceId), {
        pdfUrl,
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ PDF URL saved to Firestore:', invoiceId);
    } catch (error) {
      console.error('❌ Error saving PDF URL:', error);
      throw new Error('Failed to save PDF URL to Firestore');
    }
  }
}