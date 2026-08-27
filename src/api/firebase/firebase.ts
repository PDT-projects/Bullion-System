
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEqW2ciPiAkm8dZIqbWqmT92j20wouMXI",
  authDomain: "bullionelectronicssoftware.firebaseapp.com",
  projectId: "bullionelectronicssoftware",
  storageBucket: "bullionelectronicssoftware.firebasestorage.app",
  messagingSenderId: "777810167749",
  appId: "1:777810167749:web:9dd883ecf490423eeb6dac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
//Firestore 
export const db = getFirestore(app);
export { app };
