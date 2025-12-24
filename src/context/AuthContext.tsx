"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { User } from "@/lib/types";
import { ensureUserProfile } from "@/lib/services";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    checkSession: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const session = await account.get();
            
            // Try to get user profile, but don't fail if it errors
            let isAdmin = true; // Default to true for all users
            try {
                const userProfile = await ensureUserProfile(session.$id, session.email);
                isAdmin = userProfile?.isAdmin ?? true;
            } catch (profileError) {
                console.warn("Could not fetch user profile, using defaults:", profileError);
                // Continue with default isAdmin = true
            }

            setUser({
                uid: session.$id,
                email: session.email,
                displayName: session.name,
                photoURL: null,
                isAdmin
            });
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const signOut = async () => {
        try {
            await account.deleteSession("current");
            setUser(null);
        } catch (error) {
            console.error("Sign out failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, checkSession }}>
            {loading ? <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">Loading...</div> : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

