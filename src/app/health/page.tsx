"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { account, databases } from "@/lib/appwrite";

export default function HealthCheckPage() {
    const [checking, setChecking] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runHealthCheck = async () => {
        setChecking(true);
        const checks: any = {
            envVars: {},
            appwriteConnection: null,
            databaseAccess: null,
        };

        // 1. Check Environment Variables
        checks.envVars = {
            endpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
            projectId: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            databaseId: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            eventsCollectionId: !!process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID,
            societiesCollectionId: !!process.env.NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID,
            storageBucketId: !!process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID,
        };

        // 2. Test Appwrite Connection (Account endpoint)
        try {
            await account.get();
            checks.appwriteConnection = { success: true, message: "Connected to Appwrite" };
        } catch (error: any) {
            if (error.code === 401) {
                checks.appwriteConnection = { success: true, message: "Appwrite reachable (not logged in)" };
            } else {
                checks.appwriteConnection = { success: false, message: error.message };
            }
        }

        // 3. Test Database Access
        try {
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
            const collId = process.env.NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID || "societies";
            await databases.listDocuments(dbId!, collId, []);
            checks.databaseAccess = { success: true, message: "Database accessible" };
        } catch (error: any) {
            checks.databaseAccess = { success: false, message: error.message };
        }

        setResults(checks);
        setChecking(false);
    };

    return (
        <div className="container mx-auto py-12 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>System Health Check</CardTitle>
                    <CardDescription>
                        Diagnose connection issues with Appwrite and environment configuration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button onClick={runHealthCheck} disabled={checking} className="w-full">
                        {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Health Check
                    </Button>

                    {results && (
                        <div className="space-y-4">
                            {/* Environment Variables */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Environment Variables
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(results.envVars).map(([key, value]: any) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="font-mono">{key}</span>
                                            {value ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Appwrite Connection */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    {results.appwriteConnection?.success ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    Appwrite Connection
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {results.appwriteConnection?.message}
                                </p>
                            </div>

                            {/* Database Access */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    {results.databaseAccess?.success ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    Database Access
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {results.databaseAccess?.message}
                                </p>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 text-blue-900">Troubleshooting Tips</h3>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>If environment variables are missing, set them in Vercel Dashboard → Settings → Environment Variables</li>
                                    <li>If Appwrite connection fails, check your Appwrite endpoint URL</li>
                                    <li>If database access fails, verify collection permissions in Appwrite Console</li>
                                    <li>Add your Vercel domain to Appwrite Console → Settings → Platforms</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
