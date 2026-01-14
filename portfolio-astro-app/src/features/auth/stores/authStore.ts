import { atom } from 'nanostores'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth, db } from '@shared/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const user = atom<User | null>(null)
export const authLoading = atom<boolean>(true)
export const authError = atom<string | null>(null)

// Check Whitelist Function
const checkWhitelist = async (user: User): Promise<boolean> => {
  if (!user.email) return false

  const whitelistRef = doc(db, 'config', 'whitelist')
  try {
    const snapshot = await getDoc(whitelistRef)

    if (!snapshot.exists()) {
      return false
    }

    const data = snapshot.data()
    const emails = data?.emails || []
    return emails.includes(user.email)
  } catch (e) {
    console.error('Error checking whitelist:', e)
    return false
  }
}

// Initialize Auth Listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      // Verify whitelist before setting user
      const isAllowed = await checkWhitelist(currentUser)
      if (isAllowed) {
        user.set(currentUser)
        authError.set(null)
      } else {
        await signOut(auth)
        user.set(null)
        authError.set('Access Denied: Your email is not whitelisted.')
      }
    } else {
      user.set(null)
    }
    authLoading.set(false)
  })
}

export const signInWithGoogle = async () => {
  authLoading.set(true)
  authError.set(null)
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  } catch (error) {
    authError.set(error instanceof Error ? error.message : 'An error occurred')
    authLoading.set(false)
  }
}

export const logout = async () => {
  authLoading.set(true)
  try {
    await signOut(auth)
  } catch (error) {
    authError.set(error instanceof Error ? error.message : 'An error occurred')
  } finally {
    authLoading.set(false)
  }
}
