"use client";

import { useState } from "react";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { submitAdminRequest } from "@/lib/services";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAdminRequest, setIsAdminRequest] = useState(false);
    const [adminReason, setAdminReason] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { checkSession } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create Account
            const newAccount = await account.create(ID.unique(), email, password, name);

            // 2. Auto Login (Create Session)
            await account.createEmailPasswordSession(email, password);

            // 3. Admin Request (if selected)
            if (isAdminRequest) {
                await submitAdminRequest(newAccount.$id, name, email, adminReason || "New account request");
            }

            // 4. Update Context
            await checkSession();

            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="adminReq"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={isAdminRequest}
                                    onChange={(e) => setIsAdminRequest(e.target.checked)}
                                />
                                <Label htmlFor="adminReq" className="cursor-pointer font-medium">Request Admin/Organizer Access</Label>
                            </div>

                            {isAdminRequest && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <Label htmlFor="reason" className="text-xs">Reason / Society Name</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="I am the President of the Tech Society..."
                                        value={adminReason}
                                        onChange={(e) => setAdminReason(e.target.value)}
                                        className="h-20 text-sm"
                                        required={isAdminRequest}
                                    />
                                </div>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sign Up
                        </Button>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="underline text-indigo-600">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
