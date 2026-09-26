import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const res = await api.get('/auth/me');
          setDbUser(res.data.data);
        } catch {
          setDbUser(null);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, name, shopName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Set displayName on Firebase User if provided
    if (name) {
      try {
        await updateFirebaseProfile(firebaseUser, { displayName: name });
        setUser({ ...auth.currentUser });
      } catch (e) {
        console.warn('Set displayName warning:', e);
      }
    }

    try {
      const res = await api.post('/auth/sync-user', { name, email, shopName });
      if (res.data?.data) setDbUser(res.data.data);
    } catch (e) {
      console.warn('Initial user sync error:', e);
    }
    return firebaseUser;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) setDbUser(res.data.data);
    } catch {
      try {
        const res = await api.post('/auth/sync-user', { email });
        if (res.data?.data) setDbUser(res.data.data);
      } catch (e) {
        console.warn('User sync on login warning:', e);
      }
    }
    return firebaseUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setDbUser(null);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      setUser({ ...auth.currentUser });
      try {
        const res = await api.get('/auth/me');
        if (res.data?.data) setDbUser(res.data.data);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!auth.currentUser) throw new Error('No user logged in.');
    
    const updateObj = {};
    if (displayName !== undefined) updateObj.displayName = displayName;
    if (photoURL !== undefined) updateObj.photoURL = photoURL;

    await updateFirebaseProfile(auth.currentUser, updateObj);
    
    // Update local state copy immediately
    setUser({ ...auth.currentUser });

    // Sync with backend MongoDB
    try {
      const res = await api.put('/profile', {
        name: displayName ?? auth.currentUser.displayName,
        profileImage: photoURL ?? auth.currentUser.photoURL,
      });
      if (res.data?.data) {
        setDbUser(res.data.data);
      }
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        register,
        login,
        logout,
        refreshUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
