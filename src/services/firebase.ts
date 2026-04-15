import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
}

/* ─── Generic CRUD helpers ─── */
export const firestoreService = {
  async getAll<T extends DocumentData>(collectionName: string): Promise<T[]> {
    if (!db) return [];
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  },

  async getById<T extends DocumentData>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as T) : null;
  },

  async getByField<T extends DocumentData>(
    collectionName: string,
    field: string,
    value: string,
    sortField?: string,
  ): Promise<T[]> {
    if (!db) return [];
    let q;
    if (sortField) {
      q = query(collection(db, collectionName), where(field, '==', value), orderBy(sortField));
    } else {
      q = query(collection(db, collectionName), where(field, '==', value));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  },

  async set<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: T,
  ): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, collectionName, id), data);
  },

  async update(
    collectionName: string,
    id: string,
    data: Partial<DocumentData>,
  ): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, collectionName, id), data);
  },

  async remove(collectionName: string, id: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, collectionName, id));
  },
};

/* ─── Storage helpers ─── */
export const storageService = {
  async uploadImage(path: string, file: File): Promise<string> {
    if (!storage) return '';
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },
};

export { isFirebaseConfigured, db, doc, setDoc, getDoc, deleteDoc, onSnapshot };
export default { firestoreService, storageService };
