import { createContext, useContext, useEffect, useState } from 'react';

// Mock types to avoid breaking other components
export type User = {
  id: string;
  email?: string;
};

export type UserProfile = {
  id: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('grindguard_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const username = parsed.username || 'user';

        // Mock session restoration
        const mockUser: User = { id: 'local-user', email: 'local@grindguard.com' };
        const mockProfile: UserProfile = { id: 'local-user', username };

        setUser(mockUser);
        setProfile(mockProfile);
      } catch (e) {
        console.error("Failed to parse local user", e);
      }
    }
    setLoading(false);
  }, []);

  async function signUp(email: string, password: string, username: string) {
    // Local mode: simplified signup = signin
    return signIn(username, password);
  }

  async function signIn(username: string, password?: string) {
    try {
      // Save to local storage
      localStorage.setItem('grindguard_user', JSON.stringify({ username }));

      const mockUser: User = { id: 'local-user', email: 'local@grindguard.com' };
      const mockProfile: UserProfile = { id: 'local-user', username };

      setUser(mockUser);
      setProfile(mockProfile);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    localStorage.removeItem('grindguard_user');
    localStorage.removeItem('grindguard_solved');
    localStorage.removeItem('grindguard_ai_message');
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    // No-op for local
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
