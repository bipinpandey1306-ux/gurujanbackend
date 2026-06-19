import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "./api-client-mock";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email?: string, password?: string, isSuperadminGate?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, bio: string, passcode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = "blog_cms_jwt_token";
const USER_KEY = "blog_cms_user";
const baseUrl = import.meta.env.VITE_API_URL || "";

// Helper to retrieve the token for API headers
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session on mount
  useEffect(() => {
    async function verifySession() {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          const authUser: AuthUser = {
            id: data.id,
            email: data.email,
            firstName: data.name.split(" ")[0] || data.name,
            lastName: data.name.split(" ").slice(1).join(" ") || "",
            profileImageUrl: data.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
            role: data.role,
            isVerified: data.isVerified
          };
          localStorage.setItem(USER_KEY, JSON.stringify(authUser));
          setUser(authUser);
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = useCallback(async (email?: string, password?: string, isSuperadminGate?: boolean) => {
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isSuperadminGate })
      });

      const data = await res.json();

      if (res.ok) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.name.split(" ")[0] || data.user.name,
          lastName: data.user.name.split(" ").slice(1).join(" ") || "",
          profileImageUrl: data.user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.user.name)}`,
          role: data.user.role,
          isVerified: data.user.isVerified
        };

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        setUser(authUser);

        // Redirect to homepage
        window.location.href = "/";
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login request error:", err);
      setError("Unable to reach backend server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, bio: string, passcode: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, bio, passcode })
      });

      const data = await res.json();

      if (res.ok) {
        setIsLoading(false);
        return true;
      } else {
        setError(data.message || "Registration failed.");
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Registration request error:", err);
      setError("Unable to reach backend server. Please try again.");
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsLoading(false);
      
      // Redirect to public homepage
      window.location.href = "/";
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError
  };
}
