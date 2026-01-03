// Standard modular import for Firebase v9+
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD5aHQZLx3cLxT0gSg3Hrxm-kvyzoWpRaM",
  authDomain: "apps-b1608.firebaseapp.com",
  databaseURL: "https://apps-b1608-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apps-b1608",
  storageBucket: "apps-b1608.firebasestorage.app",
  messagingSenderId: "261386918194",
  appId: "1:261386918194:web:1b6702c0c3b1d5fd66df2b",
  measurementId: "G-L00MZXTE3H"
};

// Initialize Firebase with modular SDK v9+ functional style
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export the database instance
export const db = getDatabase(app);
