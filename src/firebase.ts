import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.log('User cancelled the sign-in popup.');
      return null;
    }
    console.error("Firebase Auth Error:", error);
    throw error;
  }
};
export const logOut = () => signOut(auth);

export async function saveProblem(uid: string, problem: any) {
  try {
    await addDoc(collection(db, 'saved_problems'), {
      ...problem,
      uid,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving problem:", error);
  }
}
