# Invoice PDF Email Notification - Send PDF to acctsdetectors4563@gmail.com on creation

## Status: 🚀 Implementation Started

## Detailed Steps:

### 1. **Add Cloud Function** `[✅ DONE]`  
   - File: `functions/src/index.ts`
   - Add `onInvoiceCreated` trigger on `invoices/{invoiceId}`
   - Fetch invoice data + pdfUrl
   - Download PDF from Storage
   - Send email w/ PDF attachment to approver emails
   - Create appNotification

### 2. **Build & Deploy** `[pending]`
   ```
   cd functions
   npm run build
   firebase deploy --only functions
   ```

### 3. **Configure Env Vars** `[pending]`
   ```
   firebase functions:config:set approver_emails=\"acctsdetectors4563@gmail.com\"
   firebase functions:config:get
   ```

### 4. **Test** `[pending]`
   - Create new invoice in app
   - Check email delivery w/ PDF attachment
   - Verify `appNotifications` collection
   - Check Functions logs: Firebase Console > Functions

### 5. **Production Notes** `[pending]`
   - Gmail app password needed in Functions env: GMAIL_USER, GMAIL_PASS
   - Monitor quota: nodemailer + Storage downloads

**Next Action: Edit functions/src/index.ts**

