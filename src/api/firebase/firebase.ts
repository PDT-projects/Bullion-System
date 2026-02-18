// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpHnEM6bjOnGYzUqQBSDZxJUEerBz3PjE",
  authDomain: "cashflow-system-9088f.firebaseapp.com",
  projectId: "cashflow-system-9088f",
  storageBucket: "cashflow-system-9088f.firebasestorage.app",
  messagingSenderId: "352663626458",
  appId: "1:352663626458:web:1b3a038255cc72f5807be3",
  measurementId: "G-1V5ZTH8JHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//authentication 
export const auth = getAuth(app);