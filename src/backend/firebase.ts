import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore'
import type { Match, StoredSettings } from '../types'
import { firebaseConfig } from './firebase-config'
import type { Backend } from './types'

const BATCH_LIMIT = 450

export function createFirebaseBackend(): Backend {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  })
  const settingsRef = (uid: string) => doc(db, 'users', uid)
  const matchRef = (uid: string, id: string) => doc(db, 'users', uid, 'matches', id)

  return {
    onSession: cb => onAuthStateChanged(auth, user => cb(user && { uid: user.uid, email: user.email })),

    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    },

    signOut: () => signOut(auth),

    subscribe(uid, cb) {
      let settings: StoredSettings | null | undefined
      let matches: Match[] | undefined
      const emit = () => {
        if (settings !== undefined && matches !== undefined) cb({ settings, matches })
      }
      const unsubSettings = onSnapshot(settingsRef(uid), snap => {
        if (snap.exists()) settings = snap.data() as StoredSettings
        else if (snap.metadata.fromCache) return
        else settings = null
        emit()
      })
      const unsubMatches = onSnapshot(collection(db, 'users', uid, 'matches'), snap => {
        matches = snap.docs.map(d => d.data() as Match)
        emit()
      })
      return () => {
        unsubSettings()
        unsubMatches()
      }
    },

    async commit(uid, { settings, put, remove }) {
      const ops: ((batch: WriteBatch) => void)[] = [
        ...(settings ? [(b: WriteBatch) => void b.set(settingsRef(uid), settings)] : []),
        ...put.map(m => (b: WriteBatch) => void b.set(matchRef(uid, m.id), m)),
        ...remove.map(id => (b: WriteBatch) => void b.delete(matchRef(uid, id))),
      ]
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db)
        ops.slice(i, i + BATCH_LIMIT).forEach(op => op(batch))
        await batch.commit()
      }
    },
  }
}
