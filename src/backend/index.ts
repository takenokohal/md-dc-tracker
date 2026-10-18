import { createFirebaseBackend } from './firebase'
import { localBackend } from './local'
import type { Backend } from './types'

export const backend: Backend = import.meta.env.MODE === 'offline' ? localBackend : createFirebaseBackend()
