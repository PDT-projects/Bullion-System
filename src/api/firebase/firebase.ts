
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCds1VtMdxGSUvavYC-uw22f6AoGHtn-3c",
  authDomain: "bullion-electronics-17234.firebaseapp.com",
  projectId: "bullion-electronics-17234",
  storageBucket: "bullion-electronics-17234.firebasestorage.app",
  messagingSenderId: "392014672622",
  appId: "1:392014672622:web:8932641e304f112a10f9ff",
  measurementId: "G-Z7DERHPHD2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
//Firestore 
export const db = getFirestore(app);
export { app };
