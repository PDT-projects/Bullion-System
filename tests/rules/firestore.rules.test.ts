// Firestore security rules — automated tests
//
// Runs against the local Firestore emulator, so nothing here touches the live
// project and nothing needs to be cleaned up afterwards.
//
//   npm run test:rules
//
// What this covers: the rules themselves — who may read, who may write, and
// which shapes are accepted. Every scenario in groups E and F of the manual
// plan is here, plus the data-layer half of A to D.
//
// What this does NOT cover: whether the application sends the right shape. A
// rule can be correct while a form still fails, because the form might omit a
// field the rule requires. Those paths — clicking through the invoice form,
// checking a bank balance moved — still need the browser, or an end-to-end
// framework. See tests/rules/README.md.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection,
} from 'firebase/firestore';

let env: RulesTestEnvironment;

/** A signed-in user's view of Firestore. */
const authed = () => env.authenticatedContext('test-user').firestore();
/** A visitor with no account at all. */
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'bullion-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

/**
 * Write a document straight past the rules.
 *
 * Update and delete tests need a document to already exist, and creating it
 * through the rules would conflate two assertions in one test — a failure would
 * not say whether create or update was at fault.
 */
async function seed(path: string, id: string, data: any) {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), path, id), data);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('registration_otps — the collection was world-readable', () => {
  // Before this rule, `allow read, write: if true` meant anyone on the internet
  // could read a passcode out of this collection and register as that address.
  it('refuses an anonymous read', async () => {
    await seed('registration_otps', 'victim@example.com', { otp: '123456' });
    await assertFails(getDoc(doc(anon(), 'registration_otps', 'victim@example.com')));
  });

  it('refuses an anonymous write', async () => {
    await assertFails(
      setDoc(doc(anon(), 'registration_otps', 'attacker@example.com'), { otp: '000000' }),
    );
  });

  // Signing in is not the boundary here. No client needs this collection at
  // all — the OTP Cloud Functions use the Admin SDK, which bypasses rules.
  it('refuses a signed-in read', async () => {
    await seed('registration_otps', 'victim@example.com', { otp: '123456' });
    await assertFails(getDoc(doc(authed(), 'registration_otps', 'victim@example.com')));
  });

  it('refuses a signed-in write', async () => {
    await assertFails(
      setDoc(doc(authed(), 'registration_otps', 'x@example.com'), { otp: '111111' }),
    );
  });
});

describe('transactions', () => {
  it('accepts a valid create', async () => {
    await assertSucceeds(
      addDoc(collection(authed(), 'transactions'), { amount: 5000, date: '2026-08-31' }),
    );
  });

  it('rejects an amount that is a string', async () => {
    await assertFails(
      addDoc(collection(authed(), 'transactions'), { amount: 'abc', date: '2026-08-31' }),
    );
  });

  it('rejects an empty date', async () => {
    await assertFails(
      addDoc(collection(authed(), 'transactions'), { amount: 5000, date: '' }),
    );
  });

  it('rejects a missing amount', async () => {
    await assertFails(
      addDoc(collection(authed(), 'transactions'), { date: '2026-08-31' }),
    );
  });

  it('rejects a null date', async () => {
    await assertFails(
      addDoc(collection(authed(), 'transactions'), { amount: 5000, date: null }),
    );
  });

  it('rejects an anonymous create', async () => {
    await assertFails(
      addDoc(collection(anon(), 'transactions'), { amount: 5000, date: '2026-08-31' }),
    );
  });

  // MAIN_CATEGORIES in types.ts lists three values but the code writes five.
  // No enum check was added for exactly this reason; these three prove that
  // decision, and would fail if the documented list were ever enforced.
  it.each(['Bills', 'Salary', 'Inventory Purchase'])(
    'accepts mainCategory "%s", which the documented list omits',
    async (cat) => {
      await assertSucceeds(
        addDoc(collection(authed(), 'transactions'), {
          amount: 1000, date: '2026-08-31', mainCategory: cat,
        }),
      );
    },
  );

  it('accepts an update that changes the amount', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertSucceeds(updateDoc(doc(authed(), 'transactions', 't1'), { amount: 200 }));
  });

  // The `!hasField('amount')` half of the update rule exists for this case.
  // Without it every note-only edit in the application would fail.
  it('accepts an update that carries no amount at all', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertSucceeds(updateDoc(doc(authed(), 'transactions', 't1'), { note: 'edited' }));
  });

  it('rejects an update that sets the amount to a string', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertFails(updateDoc(doc(authed(), 'transactions', 't1'), { amount: 'abc' }));
  });

  it('allows a signed-in read', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertSucceeds(getDoc(doc(authed(), 'transactions', 't1')));
  });

  it('refuses an anonymous read', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertFails(getDoc(doc(anon(), 'transactions', 't1')));
  });

  it('allows a signed-in delete', async () => {
    await seed('transactions', 't1', { amount: 100, date: '2026-08-31' });
    await assertSucceeds(deleteDoc(doc(authed(), 'transactions', 't1')));
  });
});

describe('invoices', () => {
  const valid = { invoiceNumber: 'INV-001', date: '2026-08-31', totalAmount: 30000 };

  it('accepts a valid create', async () => {
    await assertSucceeds(addDoc(collection(authed(), 'invoices'), valid));
  });

  it('rejects an empty invoice number', async () => {
    await assertFails(addDoc(collection(authed(), 'invoices'), { ...valid, invoiceNumber: '' }));
  });

  it('rejects a missing invoice number', async () => {
    await assertFails(
      addDoc(collection(authed(), 'invoices'), { date: '2026-08-31', totalAmount: 30000 }),
    );
  });

  it('rejects a totalAmount that is a string', async () => {
    await assertFails(addDoc(collection(authed(), 'invoices'), { ...valid, totalAmount: '30000' }));
  });

  it('rejects an empty date', async () => {
    await assertFails(addDoc(collection(authed(), 'invoices'), { ...valid, date: '' }));
  });

  // Payment recording sends paidAmount and remainingAmount but not totalAmount.
  it('accepts a payment update that omits totalAmount', async () => {
    await seed('invoices', 'i1', valid);
    await assertSucceeds(
      updateDoc(doc(authed(), 'invoices', 'i1'), { paidAmount: 30000, remainingAmount: 0 }),
    );
  });

  it('refuses an anonymous read', async () => {
    await seed('invoices', 'i1', valid);
    await assertFails(getDoc(doc(anon(), 'invoices', 'i1')));
  });
});

describe('banks', () => {
  const valid = { name: 'Test Bank', balance: 100000 };

  it('accepts a valid create', async () => {
    await assertSucceeds(addDoc(collection(authed(), 'banks'), valid));
  });

  it('rejects an empty name', async () => {
    await assertFails(addDoc(collection(authed(), 'banks'), { ...valid, name: '' }));
  });

  it('rejects a balance that is a string', async () => {
    await assertFails(addDoc(collection(authed(), 'banks'), { name: 'Test', balance: 'lots' }));
  });

  it('rejects a missing balance', async () => {
    await assertFails(addDoc(collection(authed(), 'banks'), { name: 'Test' }));
  });

  // A bank-mode transaction moves the balance as a side effect. Side-effect
  // writes are what a rule change tends to break quietly — the symptom is a
  // wrong balance rather than an error.
  it('accepts a balance-only update', async () => {
    await seed('banks', 'b1', valid);
    await assertSucceeds(updateDoc(doc(authed(), 'banks', 'b1'), { balance: 98000 }));
  });

  it('accepts a name-only update that carries no balance', async () => {
    await seed('banks', 'b1', valid);
    await assertSucceeds(updateDoc(doc(authed(), 'banks', 'b1'), { name: 'Renamed' }));
  });

  it('rejects an update that sets the balance to a string', async () => {
    await seed('banks', 'b1', valid);
    await assertFails(updateDoc(doc(authed(), 'banks', 'b1'), { balance: 'lots' }));
  });
});

describe('bills', () => {
  it('accepts a valid create', async () => {
    await assertSucceeds(
      addDoc(collection(authed(), 'bills'), { amount: 3000, company: 'Electric Co' }),
    );
  });

  it('rejects an amount that is a string', async () => {
    await assertFails(addDoc(collection(authed(), 'bills'), { amount: '3000' }));
  });

  it('rejects a missing amount', async () => {
    await assertFails(addDoc(collection(authed(), 'bills'), { company: 'Electric Co' }));
  });

  it('accepts a payment update that carries no amount', async () => {
    await seed('bills', 'b1', { amount: 3000 });
    await assertSucceeds(updateDoc(doc(authed(), 'bills', 'b1'), { amountPaid: 3000 }));
  });
});

describe('salaries', () => {
  it('accepts a valid create', async () => {
    await assertSucceeds(
      addDoc(collection(authed(), 'salaries'), { amount: 25000, employeeName: 'Test' }),
    );
  });

  it('rejects an amount that is a string', async () => {
    await assertFails(addDoc(collection(authed(), 'salaries'), { amount: '25000' }));
  });

  it('rejects a missing amount', async () => {
    await assertFails(addDoc(collection(authed(), 'salaries'), { employeeName: 'Test' }));
  });
});

describe('collections left unchanged still work', () => {
  // These carry no structural checks yet. The point of testing them is to prove
  // the change did not tighten anything by accident.
  it.each([
    ['products',              { brandName: 'Nokta', sellPrice: 100 }],
    ['employees',             { name: 'Test Employee' }],
    ['loans',                 { receiverName: 'Test', loanAmount: 5000 }],
    ['assets',                { name: 'Laptop', value: 3000 }],
    ['purchasedOrders',       { shipmentNumber: 'SHP-001' }],
    ['budgets',               { subCategory: 'Fuel', budgetLimit: 1000 }],
    ['commissions',           { amount: 500 }],
    ['payable_to_futuristic', { amount: 200 }],
  ])('%s accepts a signed-in create', async (col, data) => {
    await assertSucceeds(addDoc(collection(authed(), col), data as any));
  });
});

describe('default deny', () => {
  it('refuses a collection that has no rule', async () => {
    await assertFails(addDoc(collection(authed(), 'not_a_real_collection'), { x: 1 }));
  });
});
