// src/config/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Verifica se as credenciais do Firebase foram configuradas no .env
const isConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'sua_api_key_aqui' && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'seu-projeto'
);

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.info('🔥 Firebase conectado com sucesso!');
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar Firebase. Modo de demonstração ativo:', error);
  }
} else {
  console.info('ℹ️ Credenciais do Firebase não configuradas no .env. Operando em modo de demonstração com persistência local.');
}

export { 
  app, 
  db, 
  auth, 
  storage, 
  isConfigured,
  // Firestore helpers
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  // Auth helpers
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  // Storage helpers
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
};
