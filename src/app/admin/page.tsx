
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
    getSocieties, getCategories, updateSociety, createCategory, deleteCategory, Category,
    submitAdminRequest, getAdminRequests, approveAdminRequest, rejectAdminRequest, AdminRequest
} from "@/lib/services";
import { Society } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Save, Edit, ShieldCheck, Check, X, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPage() {
    const { user, loading, checkSession } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("societies");

    // -- Request Access State --
    const [reason, setReason] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // -- Societies Logic --
    const { data: societies, isLoading: socLoading } = useQuery({
        queryKey: ['societies'],
        queryFn: getSocieties,
        enabled: !!user?.isAdmin
    });

    const [editingSociety, setEditingSociety] = useState<any>(null); // Society type
    const [isEditOpen, setIsEditOpen] = useState(false);

    const updateSocietyMutation = useMutation({
        mutationFn: async (data: any) => {
            return updateSociety(data.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['societies'] });
            setIsEditOpen(false);
        }
    });

    const handleEditSociety = (soc: any) => {
        setEditingSociety({ ...soc });
        setIsEditOpen(true);
    };

    const handleSaveSociety = () => {
        updateSocietyMutation.mutate(editingSociety);
    };

    // -- Categories Logic --
    const { data: categories, isLoading: catLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        enabled: !!user?.isAdmin
    });

    const [newCatName, setNewCatName] = useState("");

    const addCatMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setNewCatName("");
        }
    });

    const deleteCatMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });

    // -- Admin Requests Logic --
    const { data: adminRequests, isLoading: reqLoading } = useQuery({
        queryKey: ['adminRequests'],
        queryFn: getAdminRequests,
        enabled: !!user?.isAdmin
    });


    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        // Redirect or show login
        return (
            <div className="h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Please Login</h1>
                <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </div>
        )
    }

    // --- NON-ADMIN VIEW: Request Access ---
    if (!user.isAdmin) {
        const handleRequestSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setRequestStatus('submitting');
            try {
                await submitAdminRequest(user.uid, user.displayName || "User", user.email || "", reason, secretCode);
                setRequestStatus('success');
                if (secretCode === "admin123") {
                    // Magic reload to update AuthContext
                    await checkSession();
                    window.location.reload();
                }
            } catch (error) {
                console.error(error);
                setRequestStatus('error');
            }
        };

        return (
            <div className="container mx-auto py-20 min-h-screen flex flex-col items-center justify-center">
                <Card className="max-w-lg w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-slate-100 p-4 rounded-full w-fit mb-4 dark:bg-slate-800">
                            <Lock className="h-8 w-8 text-slate-500" />
                        </div>
                        <CardTitle className="text-2xl">Admin Access Required</CardTitle>
                        <CardDescription>You do not have permission to view the admin dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requestStatus === 'success' ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit text-green-600">
                                    <Check className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Request Submitted</h3>
                                <p className="text-slate-500">Your request has been sent to the administrators for review.</p>
                                <Button variant="outline" onClick={() => router.push('/')}>Return Home</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleRequestSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Why do you need admin access?</Label>
                                    <Textarea
                                        required
                                        placeholder="I am the president of Music Society..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Verification Code (Optional)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Provided by IT department"
                                        value={secretCode}
                                        onChange={(e) => setSecretCode(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500">If you have a pre-approved code, enter it here for instant access.</p>
                                </div>
                                <Button className="w-full" disabled={requestStatus === 'submitting'}>
                                    {requestStatus === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                                {requestStatus === 'error' && <p className="text-sm text-red-500 text-center">Failed to submit request. You may already have a pending request.</p>}
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- ADMIN DASHBOARD ---
    return (
        <div className="container mx-auto py-12 min-h-screen animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage platform resources, societies, and configuration.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="societies">Societies</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="requests" className="relative">
                        Access Requests
                        {adminRequests && adminRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                {adminRequests.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="societies" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {socLoading ? <Loader2 className="animate-spin" /> : societies?.map((soc: any) => (
                            <Card key={soc.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{soc.name}</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditSociety(soc)}>
                                            <Edit className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">{soc.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-slate-500">President</span>
                                        <span className="font-medium">{soc.presidentName}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-slate-500">Vice President</span>
                                        <span className="font-medium">{soc.vicePresidentName}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Convener</span>
                                        <span className="font-medium">{soc.convenerName}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Edit Society</DialogTitle>
                                <DialogDescription>Update society details and leadership.</DialogDescription>
                            </DialogHeader>
                            {editingSociety && (
                                <div className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Name</Label>
                                        <Input value={editingSociety.name} onChange={(e) => setEditingSociety({ ...editingSociety, name: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea value={editingSociety.description} onChange={(e) => setEditingSociety({ ...editingSociety, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>President</Label>
                                            <Input value={editingSociety.presidentName} onChange={(e) => setEditingSociety({ ...editingSociety, presidentName: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Vice President</Label>
                                            <Input value={editingSociety.vicePresidentName} onChange={(e) => setEditingSociety({ ...editingSociety, vicePresidentName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Convener</Label>
                                        <Input value={editingSociety.convenerName} onChange={(e) => setEditingSociety({ ...editingSociety, convenerName: e.target.value })} />
                                    </div>
                                    <Button onClick={handleSaveSociety} disabled={updateSocietyMutation.isPending} className="w-full">
                                        {updateSocietyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="categories" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Categories</CardTitle>
                            <CardDescription>Add or remove event categories available on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <Input
                                    placeholder="New Category Name..."
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="max-w-xs"
                                />
                                <Button onClick={() => addCatMutation.mutate(newCatName)} disabled={!newCatName.trim() || addCatMutation.isPending}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Category
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {catLoading ? <Loader2 className="animate-spin" /> : categories?.map((cat: any) => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
                                        <span className="font-medium">{cat.name}</span>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteCatMutation.mutate(cat.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Requests</CardTitle>
                            <CardDescription>Review users requesting to become administrators.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reqLoading ? <Loader2 className="animate-spin" /> : adminRequests?.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">No pending requests</div>
                            ) : (
                                <div className="space-y-4">
                                    {adminRequests?.map((req: AdminRequest) => (
                                        <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-900 gap-4">
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {req.userName} <span className="text-xs font-normal text-slate-500">({req.email})</span>
                                                </div>
                                                <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">"{req.reason}"</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={async () => {
                                                        await approveAdminRequest(req.id, req.userId);
                                                        queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
                                                    }}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={async () => {
                                                        await rejectAdminRequest(req.id);
                                                        queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
                                                    }}
                                                >
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
