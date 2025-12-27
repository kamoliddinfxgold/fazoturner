// Firebase konfiguratsiyasi
const firebaseConfig = {
     apiKey: "AIzaSyCtoAZ95H6s_cezC1P_vJWcnR1y2cOUmQA",
  authDomain: "fazo-88141.firebaseapp.com",
  projectId: "fazo-88141",
  storageBucket: "fazo-88141.firebasestorage.app",
  messagingSenderId: "806139158942",
  appId: "1:806139158942:web:b0812024909f367fd4b68f",
  measurementId: "G-WD1B96JPP4"
  };
  
  // Firebase ni ishga tushirish
  firebase.initializeApp(firebaseConfig);
  
  // Firebase servislari
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();