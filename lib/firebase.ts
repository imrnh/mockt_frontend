// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCYgwrLsI7stWOD95egfokIGolVqUlxQ-8",
    authDomain: "mockt-interview-prep.firebaseapp.com",
    projectId: "mockt-interview-prep",
    storageBucket: "mockt-interview-prep.firebasestorage.app",
    messagingSenderId: "458963516306",
    appId: "1:458963516306:web:7c8c8ef837168d715d9f4b"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider as provider };




/*

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "p",
    messagingSenderId: "",
    appId: "1:::"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider as provider };


*/