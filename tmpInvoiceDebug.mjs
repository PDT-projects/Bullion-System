import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const firebaseConfig = { apiKey: 'AIzaSyBEy9gC_CpC1lDMf_MHnEdbtlL4gu5CRq4', authDomain: 'bullion-electronics.firebaseapp.com', projectId: 'bullion-electronics', storageBucket: 'bullion-electronics.firebasestorage.app', messagingSenderId: '584578282236', appId: '1:584578282236:web:dbffde515fc363f7249d79', measurementId: 'G-1QS2YRW6WG' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const snapshot = await getDocs(collection(db, 'invoices'));
console.log('count', snapshot.size);
for (const doc of snapshot.docs.slice(0, 40)) { const data = doc.data(); console.log(JSON.stringify({id: doc.id, branch: data.branch, salespersonLocation: data.salespersonLocation, salesperson: data.salesperson})); }

