"use client";

/**import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role: "customer" | "farmer" | "shopkeeper";
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("poultryhub-token");
    const savedUser = localStorage.getItem("poultryhub-user");

    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser) as User);
    }

    setLoading(false);
  }, []);

  const persist = useCallback((nextUser: User, accessToken: string) => {
    setUser(nextUser);
    setToken(accessToken);
    localStorage.setItem("poultryhub-token", accessToken);
    localStorage.setItem("poultryhub-user", JSON.stringify(nextUser));
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await api.login({ identifier, password });
      persist(response.data.user, response.data.accessToken);
    },
    [persist]
  );

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      role: "customer" | "farmer" | "shopkeeper";
    }) => {
      const response = await api.register(payload);
      persist(response.data.user, response.data.accessToken);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("poultryhub-token");
    localStorage.removeItem("poultryhub-user");
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("poultryhub-user", JSON.stringify(updatedUser));
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateUser }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}**/



"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (
    identifier: string,
    password: string
  ) => Promise<User>;

  register: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role: "customer" | "farmer" | "shopkeeper";
    verificationDocument?: string;
    verificationDocumentName?: string;
    verificationDocumentMimeType?: string;
  }) => Promise<void>;

  logout: () => void;

  updateUser: (updatedUser: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(
        "poultryhub-token"
      );

      const savedUser = localStorage.getItem(
        "poultryhub-user"
      );

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser) as User);
      }
    } catch (error) {
      console.error(
        "Failed to restore authentication:",
        error
      );

      localStorage.removeItem("poultryhub-token");
      localStorage.removeItem("poultryhub-user");

      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback(
    (nextUser: User, accessToken: string) => {
      setUser(nextUser);
      setToken(accessToken);

      localStorage.setItem(
        "poultryhub-token",
        accessToken
      );

      localStorage.setItem(
        "poultryhub-user",
        JSON.stringify(nextUser)
      );
    },
    []
  );

  /**
   * Login user and return the authenticated user.
   */
  const login = useCallback(
    async (
      identifier: string,
      password: string
    ): Promise<User> => {
      const response = await api.login({
        identifier,
        password,
      });

      const loggedInUser = response.data.user;
      const accessToken = response.data.accessToken;

      persist(loggedInUser, accessToken);

      return loggedInUser;
    },
    [persist]
  );

  /**
   * Register a new user.
   */
  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      role: "customer" | "farmer" | "shopkeeper";
      verificationDocument?: string;
      verificationDocumentName?: string;
      verificationDocumentMimeType?: string;
    }) => {
      const response = await api.register(payload);

      persist(
        response.data.user,
        response.data.accessToken
      );
    },
    [persist]
  );

  /**
   * Logout current user.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("poultryhub-token");
    localStorage.removeItem("poultryhub-user");
  }, []);

  /**
   * Update currently logged-in user.
   */
  const updateUser = useCallback(
    (updatedUser: User) => {
      setUser(updatedUser);

      localStorage.setItem(
        "poultryhub-user",
        JSON.stringify(updatedUser)
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}

