import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcTOJImNIZ1luoGVIbRmTMfRjKyHc3o-Y",
  authDomain: "erp-system-baacb.firebaseapp.com",
  projectId: "erp-system-baacb",
  storageBucket: "erp-system-baacb.firebasestorage.app",
  messagingSenderId: "637818110198",
  appId: "1:637818110198:web:623aa945d32788b20fecd7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//authentication 
export const auth = getAuth(app);
//Firestore 
export const db = getFirestore(app);
