
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
