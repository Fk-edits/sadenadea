import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVWaHveZgGgcAcgojBMDmDdu1fdeJBgU4",
  authDomain: "danfer-8bfd4.firebaseapp.com",
  projectId: "danfer-8bfd4",
  storageBucket: "danfer-8bfd4.firebasestorage.app",
  messagingSenderId: "825811670471",
  appId: "1:825811670471:web:48bf9fa767bedee21075e2",
  measurementId: "G-Y888P5969S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
