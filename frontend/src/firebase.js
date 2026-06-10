import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvtUVAKMXC9_n-zwG8t3tC2DSohCxRGcY",
  authDomain: "brain-tumor-fc7d5.firebaseapp.com",
  projectId: "brain-tumor-fc7d5",
  storageBucket: "brain-tumor-fc7d5.firebasestorage.app",
  messagingSenderId: "1033087598213",
  appId: "1:1033087598213:web:f3c848484ae981cb5733ec",
  measurementId: "G-Y5G0RN41PX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
