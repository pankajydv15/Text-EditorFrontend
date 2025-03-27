// Firebase ka config yaha paste karo
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDslZZbOjDje2QMmncX0ibUl3-ugH4cbmw",
    authDomain: "text-editor-91b2e.firebaseapp.com",
    projectId: "text-editor-91b2e",
    storageBucket: "text-editor-91b2e.firebasestorage.app",
    messagingSenderId: "979027696315",
    appId: "1:979027696315:web:504d5a840a6353eded279e",
    measurementId: "G-5LLFNBJC0P"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
