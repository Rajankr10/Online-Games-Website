// Import necessary Firebase modules

// firebase-config.js 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js"; 
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js"; 
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js"; 
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Your web app's Firebase configuration const 
const firebaseConfig = { 
    apiKey: "AIzaSyCR2InkLaXaREWOaLAZElMJvorVS_lRq_A", 
    authDomain: "toonverse-6caaa.firebaseapp.com", 
    projectId: "toonverse-6caaa", 
    storageBucket: "toonverse-6caaa.appspot.com", 
    messagingSenderId: "867538282751", 
    appId: "1:867538282751:web:85edc6b4d8b80ef2ec84ca", 
    measurementId: "G-ZQDT068RHG" };

// Initialize Firebase 
const app = initializeApp(firebaseConfig); 
let analytics;
try{
    analytics = getAnalytics(app);
} catch(error){
    console.warn("Analytics not initialized:", error);
}
const db = getFirestore(app); 
const auth = getAuth(app);
console.log(app);
console.log(db);


// ✅ Set authentication persistence to LOCAL using modular syntax
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Auth persistence set to LOCAL."))
    .catch((error) => console.error("Error setting auth persistence:", error));

export { app, db,auth};
