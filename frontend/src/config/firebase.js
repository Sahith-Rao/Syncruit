import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC0C2k2QzFMUov6yPzIFJlQKeeA5vnmZFE",
  authDomain: "project-k-7155f.firebaseapp.com",
  projectId: "project-k-7155f",
  storageBucket: "project-k-7155f.firebasestorage.app",
  messagingSenderId: "101017712148",
  appId: "1:101017712148:web:a51dbc1599c41351b95901"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app; 