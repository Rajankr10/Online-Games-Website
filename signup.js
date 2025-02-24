import { auth, db } from "./firebase-config.js";
import {  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {  doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// const auth = getAuth();
// const db = getFirestore();

// Function to handle email/password sign up
async function SignUp(event) {
    event.preventDefault();
    console.log('SignUp function triggered'); // Debug message

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            uid: user.uid,
            createdAt: new Date().toISOString()
        });

        alert('Sign up successful!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing up:', error.message);
        alert(error.message);
    }
}

// Google sign up
async function googleSignUp() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save user info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            uid: user.uid,
            createdAt: new Date().toISOString()
        }, { merge: true });

        alert('Sign up with Google successful!');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error with Google sign up:', error.message);
        alert(error.message);
    }
}

// Facebook sign up
async function facebookSignUp() {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save user info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            uid: user.uid,
            createdAt: new Date().toISOString()
        }, { merge: true });

        alert('Sign up with Facebook successful!');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error with Facebook sign up:', error.message);
        alert(error.message);
    }
}


// Expose functions to the global scope
window.SignUp = SignUp;
window.googleSignUp = googleSignUp;
window.facebookSignUp = facebookSignUp;

// Ensure DOM is loaded before adding event listeners
window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.google-btn').addEventListener('click', googleSignUp);
    document.querySelector('.facebook-btn').addEventListener('click', facebookSignUp);
});
