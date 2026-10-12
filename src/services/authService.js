// src/services/authService.js
import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  isConfigured 
} from '../config/firebase.js';

const DEMO_ADMIN_KEY = 'dinha_demo_admin_session';
const subscribers = new Set();

function notifySubscribers(user) {
  subscribers.forEach(callback => {
    try {
      callback(user);
    } catch (err) {
      console.error('Erro ao notificar subscriber de auth:', err);
    }
  });
}

/**
 * Autentica o usuário no Firebase Auth ou em modo de demonstração local
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user: Object, isDemo: boolean}>}
 */
export async function loginAdmin(email, password) {
  if (!email || !password) {
    throw new Error('Preencha e-mail e senha.');
  }

  if (isConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userObj = { ...userCredential.user, isDemo: false };
      notifySubscribers(userObj);
      return { user: userObj, isDemo: false };
    } catch (error) {
      console.error('Erro de autenticação Firebase:', error);
      let message = 'Falha ao autenticar.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Usuário administrador não encontrado.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Acesso temporariamente bloqueado por excesso de tentativas.';
      }
      throw new Error(message);
    }
  }

  // Modo Demo: permite login para testar o CRUD localmente
  if ((email === 'admin@loja.com' && password === 'admin123') || (email && password.length >= 6)) {
    const demoUser = {
      uid: 'demo-admin-uid-123',
      email: email,
      displayName: 'Administradora Dinha',
      isDemo: true
    };
    sessionStorage.setItem(DEMO_ADMIN_KEY, JSON.stringify(demoUser));
    notifySubscribers(demoUser);
    return { user: demoUser, isDemo: true };
  } else {
    throw new Error('Senha deve ter no mínimo 6 caracteres. (Demo: admin@loja.com / admin123)');
  }
}

/**
 * Encerra a sessão do administrador
 */
export async function logoutAdmin() {
  if (isConfigured && auth) {
    await signOut(auth);
  }
  sessionStorage.removeItem(DEMO_ADMIN_KEY);
  notifySubscribers(null);
}

/**
 * Observa alterações no estado de autenticação
 * @param {Function} callback 
 * @returns {Function} Função de cancelamento do listener
 */
export function subscribeAuthState(callback) {
  subscribers.add(callback);

  if (isConfigured && auth) {
    return onAuthStateChanged(auth, (user) => {
      const formattedUser = user ? { ...user, isDemo: false } : null;
      callback(formattedUser);
    });
  }

  // Modo Demo: notifica imediatamente com o usuário salvo se houver
  const stored = sessionStorage.getItem(DEMO_ADMIN_KEY);
  callback(stored ? { ...JSON.parse(stored), isDemo: true } : null);

  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Retorna o usuário logado no momento
 */
export function getCurrentAdmin() {
  if (isConfigured && auth && auth.currentUser) {
    return { ...auth.currentUser, isDemo: false };
  }
  const stored = sessionStorage.getItem(DEMO_ADMIN_KEY);
  return stored ? JSON.parse(stored) : null;
}
