
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

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

// Firestore's default transport (WebChannel over QUIC/HTTP3) fails outright
// on some networks — corporate firewalls, some antivirus software, certain
// ISPs/proxies that interfere with QUIC/UDP — surfacing as repeated
// `net::ERR_QUIC_PROTOCOL_ERROR.QUIC_TOO_MANY_RTOS` on the Listen channel in
// the browser console. When that happens, writes can still go through (plain
// HTTPS requests), but the live onSnapshot channel that pushes updates back
// never recovers — so changes never appear to take effect, anywhere in the
// app, until a full reload happens to catch a fresh read. Auto-detecting
// long-polling sidesteps QUIC entirely on networks where it's unreliable,
// while still using the normal fast transport everywhere else.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export const functions = getFunctions(app);
export { app };
