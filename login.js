// Import Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
import { auth,db } from './firebase-config.js';
import { signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, getDoc,setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"; // ✅ Import getDoc

// Initialize Firebase
// const analytics = getAnalytics(app);
// const auth = getAuth(app);  
// const db = getFirestore(app);

// Function to register a new user
// async function registerUser() {
//     const name = document.getElementById('reg-name').value;
//     const email = document.getElementById('reg-email').value;
//     const password = document.getElementById('reg-password').value;

//     try {
//         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//         const user = userCredential.user;

//         // Add user to Firestore
//         await setDoc(doc(db, "users", user.uid), {
//             name: name,
//             email: email,
//             favorites: []
//         });

//         alert('User registered successfully');
//     } catch (error) {
//         console.error('Error registering user:', error.message);
//     }
// }

// Function to log in an existing user
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('User logged in successfully');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging in:', error.message);
        alert('Login failed: ' + error.message);
    }
}

// Function to handle authentication state changes
onAuthStateChanged(auth, async (user) => {
    const userInfoDiv = document.getElementById('user-info');
    if (user) {
        try{
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userInfoDiv.innerHTML = `
                <p>Welcome, ${userData.name} (${userData.email})</p>
                <button onclick="logoutUser()">Logout</button>
            `;
    } else {
        console.warn('No user document found in Firestore.');
    }
    } catch (error) {
    console.error('Error fetching user data:', error.message);
    alert('Permission error: ' + error.message);
}
} else {
if (userInfoDiv) {
    userInfoDiv.innerHTML = `<p>No user is logged in.</p>`;
}
}
});

// Google login
async function googleLogin() {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user already exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            // Save user info to Firestore if it doesn't exist
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                favorites: []
            });
        }

        alert('Google login successful!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error with Google login:', error.message);
        alert('Google login failed: ' + error.message);
    }
}

// Facebook login
async function facebookLogin() {
    const provider = new FacebookAuthProvider();

    // Add the 'email' scope
    provider.addScope('email');

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user already exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            // Save user info to Firestore if it doesn't exist
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                favorites: []
            });
        }

        alert('Facebook login successful!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error with Facebook login:', error.message);
        alert('Facebook login failed: ' + error.message);
    }
}
// Function to log out the user
async function logoutUser() {
    try {
        await signOut(auth);
        alert('User logged out successfully');
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
}

// export { registerUser, loginUser, logoutUser };

// Expose functions to the global scope
// window.registerUser = registerUser;
// Expose functions to the global scope
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.googleLogin = googleLogin;
window.facebookLogin = facebookLogin;

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.google-btn').addEventListener('click', googleLogin);
    document.querySelector('.facebook-btn').addEventListener('click', facebookLogin);
});
