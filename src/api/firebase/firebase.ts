// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsK63gcLaAKTBGmUUWNGbbyJm7tJNGTSI",
  authDomain: "erp-system-e0e74.firebaseapp.com",
  projectId: "erp-system-e0e74",
  storageBucket: "erp-system-e0e74.firebasestorage.app",
  messagingSenderId: "580944226067",
  appId: "1:580944226067:web:b25eb124dcde229c829ce6",
  measurementId: "G-KEMS5LRB7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


//authentication 
export const auth = getAuth(app);