import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDcF9bvdT_5DFJUP1nxBwYng6WTmHsUDs",
  projectId: "sbi-app-c440c",
  storageBucket: "sbi-app-c440c.firebasestorage.app",
  messagingSenderId: "609877720146",
  appId: "1:609877720146:ios:d1e1ad401722d0086af38b",
};

// Initialize Firebase (avoid re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

export default app;
