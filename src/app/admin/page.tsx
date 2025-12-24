"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
    getSocieties, getCategories, updateSociety, createCategory, deleteCategory, createSociety, Category
} from "@/lib/services";
import { Society } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Edit, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("societies");

    // -- Societies Logic --
    const { data: societies, isLoading: socLoading } = useQuery({
        queryKey: ['societies'],
        queryFn: getSocieties,
        enabled: !!user
    });

    const [editingSociety, setEditingSociety] = useState<Society | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSociety, setNewSociety] = useState({
        name: "",
        description: "",
        presidentName: "",
        vicePresidentName: "",
        convenerName: ""
    });

    const updateSocietyMutation = useMutation({
        mutationFn: async (data: Society) => {
            return updateSociety(data.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['societies'] });
            setIsEditOpen(false);
        }
    });

    const createSocietyMutation = useMutation({
        mutationFn: async (data: Omit<Society, "id">) => {
            return createSociety(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['societies'] });
            setIsCreateOpen(false);
            setNewSociety({ name: "", description: "", presidentName: "", vicePresidentName: "", convenerName: "" });
        }
    });

    const handleEditSociety = (soc: Society) => {
        // Only allow editing if user created it
        if (soc.createdBy !== user?.uid) {
            alert("You can only edit societies you created.");
            return;
        }
        setEditingSociety({ ...soc });
        setIsEditOpen(true);
    };

    const handleSaveSociety = () => {
        if (editingSociety) {
            updateSocietyMutation.mutate(editingSociety);
        }
    };

    const handleCreateSociety = () => {
        createSocietyMutation.mutate({
            ...newSociety,
            createdBy: user?.uid
        });
    };

    // -- Categories Logic --
    const { data: categories, isLoading: catLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        enabled: !!user
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

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Please Login</h1>
                <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </div>
        )
    }

    // --- ADMIN DASHBOARD (All logged-in users are admins) ---
    return (
        <div className="container mx-auto py-12 min-h-screen animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage your societies and platform content.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="societies">Societies</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="societies" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Your Societies</h2>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4 mr-2" /> Create Society
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create New Society</DialogTitle>
                                    <DialogDescription>Add a new society or club to the platform.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Name</Label>
                                        <Input value={newSociety.name} onChange={(e) => setNewSociety({ ...newSociety, name: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea value={newSociety.description} onChange={(e) => setNewSociety({ ...newSociety, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>President</Label>
                                            <Input value={newSociety.presidentName} onChange={(e) => setNewSociety({ ...newSociety, presidentName: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Vice President</Label>
                                            <Input value={newSociety.vicePresidentName} onChange={(e) => setNewSociety({ ...newSociety, vicePresidentName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Convener</Label>
                                        <Input value={newSociety.convenerName} onChange={(e) => setNewSociety({ ...newSociety, convenerName: e.target.value })} />
                                    </div>
                                    <Button onClick={handleCreateSociety} disabled={createSocietyMutation.isPending} className="w-full">
                                        {createSocietyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {socLoading ? <Loader2 className="animate-spin" /> : societies?.map((soc: Society) => (
                            <Card key={soc.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{soc.name}</CardTitle>
                                        {soc.createdBy === user?.uid && (
                                            <Button variant="ghost" size="icon" onClick={() => handleEditSociety(soc)}>
                                                <Edit className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        )}
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
                                    {soc.createdBy !== user?.uid && (
                                        <p className="text-xs text-slate-400 italic pt-2">Created by another user</p>
                                    )}
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
                                {catLoading ? <Loader2 className="animate-spin" /> : categories?.map((cat: Category) => (
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
            </Tabs>
        </div>
    );
}
