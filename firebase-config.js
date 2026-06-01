// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDceDGKyu8tyZ_ZLPefkL3ElzVNHfQmN4",
  authDomain: "sass-school-ea659.firebaseapp.com",
  projectId: "sass-school-ea659",
  storageBucket: "sass-school-ea659.firebasestorage.app",
  messagingSenderId: "941464239698",
  appId: "1:941464239698:web:ea1fb74408bca4fc95698b",
  measurementId: "G-VPKNRKCHTR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ OpenRouter API key – stored here for easy access
const OPENROUTER_API_KEY = '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';

export { auth, db, OPENROUTER_API_KEY, firebaseConfig };