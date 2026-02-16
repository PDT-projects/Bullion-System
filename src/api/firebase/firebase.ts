// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAOJvb0wMJTD8TnK1MuMFH7-pmCT8VBPs",
  authDomain: "cashflow-system-3ab2b.firebaseapp.com",
  projectId: "cashflow-system-3ab2b",
  storageBucket: "cashflow-system-3ab2b.firebasestorage.app",
  messagingSenderId: "660308923185",
  appId: "1:660308923185:web:1bc6e38e03bdd45b31d610",
  measurementId: "G-C293HCL576"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//authentication 
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app, "default");
