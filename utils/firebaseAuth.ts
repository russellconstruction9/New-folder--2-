/**
 * Firebase Authentication Service
 * Handles user authentication with Firebase Auth
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User as AppUser } from '../types';

export interface AuthError {
  code: string;
  message: string;
}

export class FirebaseAuthService {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, userData: {
    name: string;
    role: string;
    hourlyRate: number;
  }): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Create user document in Firestore
      await this.createUserDocument(userCredential.user, userData);

      return userCredential;
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  // Create user document in Firestore
  private async createUserDocument(user: User, userData: {
    name: string;
    role: string;
    hourlyRate: number;
  }): Promise<void> {
    const userDoc: Omit<AppUser, 'id'> = {
      name: userData.name,
      role: userData.role,
      hourlyRate: userData.hourlyRate,
      avatarUrl: user.photoURL || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
      isClockedIn: false,
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
  }

  // Get user document from Firestore
  async getUserDocument(uid: string): Promise<AppUser | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return {
          id: parseInt(uid.slice(-6), 16), // Convert UID to number for compatibility
          ...userDoc.data()
        } as AppUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  // Update user document
  async updateUserDocument(uid: string, data: Partial<AppUser>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, data);
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  // Listen to authentication state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Format Firebase errors for user display
  private formatError(error: any): AuthError {
    let message = 'An unexpected error occurred';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error.message || message;
    }

    return {
      code: error.code || 'unknown',
      message
    };
  }
}

// Export singleton instance
export const firebaseAuth = new FirebaseAuthService();