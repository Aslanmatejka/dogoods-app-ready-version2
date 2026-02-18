import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from './authService.js';

const AuthContext = createContext({});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize state from authService's localStorage-restored values
  // This prevents a flash where isAuthenticated=false before init() completes
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isUserAuthenticated());
  const [isAdmin, setIsAdmin] = useState(authService.isUserAdmin());
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

      useEffect(() => {
        let isMounted = true;
        
        const initAuth = async () => {
            try {
                console.log('🔐 [AuthContext] initAuth starting. Pre-init state:', {
                    isAuthenticated: authService.isUserAuthenticated(),
                    user: authService.getCurrentUser()?.email
                });
                // Wait for auth service to initialize (idempotent - only runs once)
                await authService.init();
                
                if (isMounted) {
                    const newAuth = authService.isUserAuthenticated();
                    console.log('🔐 [AuthContext] initAuth complete. isAuthenticated:', newAuth);
                    // Set state from validated Supabase session
                    setUser(authService.getCurrentUser());
                    setIsAuthenticated(newAuth);
                    setIsAdmin(authService.isUserAdmin());
                    setInitialized(true);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth state changes
        const unsubscribe = authService.addListener(({ user, isAuthenticated, isAdmin }) => {
            if (isMounted) {
                setUser(user);
                setIsAuthenticated(isAuthenticated);
                setIsAdmin(isAdmin);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    initialized,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    uploadAvatar: authService.uploadAvatar.bind(authService),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
