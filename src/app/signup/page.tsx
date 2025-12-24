"use client";

import { useState } from "react";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUniversities, createUniversity } from "@/lib/services";
import { ensureUserProfile } from "@/lib/services";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [university, setUniversity] = useState("Global");
    const [isAddUniOpen, setIsAddUniOpen] = useState(false);
    const [newUniName, setNewUniName] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { checkSession } = useAuth();
    const queryClient = useQueryClient();

    const { data: universities } = useQuery({
        queryKey: ['universities'],
        queryFn: getUniversities
    });

    const addUniMutation = useMutation({
        mutationFn: createUniversity,
        onSuccess: (newUni) => {
            queryClient.invalidateQueries({ queryKey: ['universities'] });
            setUniversity(newUni.name);
            setIsAddUniOpen(false);
            setNewUniName("");
        }
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create Account
            const newAccount = await account.create(ID.unique(), email, password, name);

            // 2. Auto Login (Create Session)
            await account.createEmailPasswordSession(email, password);

            // 3. Create User Profile with University
            await ensureUserProfile(newAccount.$id, email, university);

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

                        <div className="space-y-2">
                            <Label htmlFor="university">University / Institution</Label>
                            <div className="flex gap-2">
                                <Select value={university} onValueChange={setUniversity} required>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select University" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {universities?.map((uni: any) => (
                                            <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={isAddUniOpen} onOpenChange={setIsAddUniOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="icon" title="Add New University">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New University</DialogTitle>
                                            <DialogDescription>Add a university that's not in the list.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>University Name</Label>
                                                <Input
                                                    value={newUniName}
                                                    onChange={(e) => setNewUniName(e.target.value)}
                                                    placeholder="e.g., Harvard University"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => addUniMutation.mutate(newUniName)}
                                                disabled={!newUniName.trim() || addUniMutation.isPending}
                                                className="w-full"
                                            >
                                                {addUniMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add University
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
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
