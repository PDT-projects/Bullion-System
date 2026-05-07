
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
  apiKey: "AIzaSyBEy9gC_CpC1lDMf_MHnEdbtlL4gu5CRq4",
  authDomain: "bullion-electronics.firebaseapp.com",
  projectId: "bullion-electronics",
  storageBucket: "bullion-electronics.firebasestorage.app",
  messagingSenderId: "584578282236",
  appId: "1:584578282236:web:dbffde515fc363f7249d79",
  measurementId: "G-1QS2YRW6WG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
//Firestore 
export const db = getFirestore(app);
export { app };
