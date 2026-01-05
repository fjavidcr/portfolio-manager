import { atom } from 'nanostores';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { auth } from '@shared/lib/firebase';

export const user = atom<User | null>(null);
export const authLoading = atom<boolean>(true);
export const authError = atom<string | null>(null);

// Initialize Auth Listener
if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, (currentUser) => {
        user.set(currentUser);
        authLoading.set(false);
    });
}

export const signInWithGoogle = async () => {
    authLoading.set(true);
    authError.set(null);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        authError.set(error.message);
        authLoading.set(false);
    }
};

export const logout = async () => {
    authLoading.set(true);
    try {
        await signOut(auth);
    } catch (error: any) {
        authError.set(error.message);
    } finally {
        authLoading.set(false);
    }
};
