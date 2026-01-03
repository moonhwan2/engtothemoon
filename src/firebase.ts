// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5aHQZLx3cLxT0gSg3Hrxm-kvyzoWpRaM",
  authDomain: "apps-b1608.firebaseapp.com",
  databaseURL: "https://apps-b1608-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apps-b1608",
  storageBucket: "apps-b1608.firebasestorage.app",
  messagingSenderId: "261386918194",
  appId: "1:261386918194:web:fcc8f5d37fd88d3e66df2b",
  measurementId: "G-TWF9M6J59N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firestore와 Auth export (App.tsx에서 사용)
export const db = getFirestore(app);
export const auth = getAuth(app);
