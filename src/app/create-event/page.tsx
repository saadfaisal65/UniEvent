"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addEvent, getSocieties, getUniversities, createUniversity, getCategories, createCategory, createSociety } from "@/lib/services";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Link as LinkIcon, Users, CalendarDays, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Society } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CreateEventPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState("");
    const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
    const [eventType, setEventType] = useState<"official" | "unofficial">("unofficial");
    const [file, setFile] = useState<File | null>(null);



    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        location: "",
        category: "",
        description: "",
        registrationLink: "",
        university: "Global",
        restrictToUniversity: false,
    });

    // University State
    const [isAddUniOpen, setIsAddUniOpen] = useState(false);
    const [newUniName, setNewUniName] = useState("");
    const [isAddingUni, setIsAddingUni] = useState(false);

    // Category State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    // Society State
    const [isAddSocietyOpen, setIsAddSocietyOpen] = useState(false);
    const [newSocietyData, setNewSocietyData] = useState({
        name: "",
        description: "",
        presidentName: "",
        vicePresidentName: "",
        convenerName: "",
        university: "Global"
    });

    // Update university when user loads
    useEffect(() => {
        if (user?.university) {
            setNewSocietyData(prev => ({ ...prev, university: user.university || "Global" }));
        }
    }, [user]);

    const [isAddingSociety, setIsAddingSociety] = useState(false);

    const queryClient = useQueryClient();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories
    });

    const { data: societies } = useQuery({
        queryKey: ['societies'],
        queryFn: getSocieties
    });

    const { data: universities } = useQuery({
        queryKey: ['universities'],
        queryFn: getUniversities
    });

    const handleAddUniversity = async () => {
        if (!newUniName.trim()) return;
        setIsAddingUni(true);
        try {
            const newUni = await createUniversity(newUniName.trim());
            await queryClient.invalidateQueries({ queryKey: ['universities'] });
            setFormData(prev => ({ ...prev, university: newUni.name }));
            setIsAddUniOpen(false);
            setNewUniName("");
        } catch (error) {
            console.error("Failed to add university", error);
            alert("Failed to add university.");
        } finally {
            setIsAddingUni(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsAddingCategory(true);
        try {
            await createCategory(newCategoryName.trim());
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
            setIsAddCategoryOpen(false);
            setNewCategoryName("");
        } catch (error) {
            console.error("Failed to add category", error);
            alert("Failed to add category.");
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleAddSociety = async () => {
        if (!newSocietyData.name.trim() || !newSocietyData.description.trim()) return;
        setIsAddingSociety(true);
        try {
            const newSoc = await createSociety({
                name: newSocietyData.name.trim(),
                description: newSocietyData.description.trim(),
                presidentName: newSocietyData.presidentName,
                vicePresidentName: newSocietyData.vicePresidentName,
                convenerName: newSocietyData.convenerName,
                university: newSocietyData.university,
                createdBy: user?.uid
            });
            await queryClient.invalidateQueries({ queryKey: ['societies'] });
            setSelectedSocieties([...selectedSocieties, newSoc.id]);
            setIsAddSocietyOpen(false);
            setNewSocietyData({
                name: "",
                description: "",
                presidentName: "",
                vicePresidentName: "",
                convenerName: "",
                university: user?.university || "Global"
            });
        } catch (error) {
            console.error("Failed to add society", error);
            alert("Failed to add society.");
        } finally {
            setIsAddingSociety(false);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            let imageId = undefined;
            if (file) {
                imageId = await uploadFile(file);
            }
            return addEvent({ ...data, imageId });
        },
        onSuccess: () => {
            router.push("/");
        },
        onError: () => {
            setError("Failed to create event. Please try again.");
        }
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/create-event");
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Native time input returns 24h format "HH:mm"
        const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

        mutation.mutate({
            title: formData.title,
            date: dateTime,
            location: formData.location,
            category: formData.category,
            description: formData.description,
            organizerId: user.uid,
            registrationLink: formData.registrationLink,
            university: formData.university,
            restrictToUniversity: formData.restrictToUniversity,
            societyIds: eventType === "official" ? selectedSocieties : [], // Only send societies if official
        });
    };

    const toggleSociety = (id: string) => {
        setSelectedSocieties(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Host an Event</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Bring the community together. Fill in the details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Section */}
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-indigo-600" /> Basic Details
                    </h2>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Annual Tech Symposium"
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <div className="flex gap-2">
                                    <Select onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                                        <SelectTrigger className="h-11 flex-1">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories?.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" className="h-11" title="Add New Category">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Category</DialogTitle>
                                                <DialogDescription>Create a new event category.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Category Name</Label>
                                                    <Input
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="e.g., Workshop"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleAddCategory}
                                                    disabled={!newCategoryName.trim() || isAddingCategory}
                                                    className="w-full"
                                                >
                                                    {isAddingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Add Category
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="university">University / Institution</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.university} onValueChange={(value) => setFormData({ ...formData, university: value })} required>
                                        <SelectTrigger className="h-11 flex-1">
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
                                            <Button type="button" variant="outline" className="h-11 px-3" title="Add New University">
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New University</DialogTitle>
                                                <DialogDescription>
                                                    Enter the name of the new university or institution.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newUniName">University Name</Label>
                                                    <Input
                                                        id="newUniName"
                                                        value={newUniName}
                                                        onChange={(e) => setNewUniName(e.target.value)}
                                                        placeholder="e.g. Yale University"
                                                    />
                                                </div>
                                                <Button type="button" onClick={handleAddUniversity} disabled={isAddingUni || !newUniName.trim()} className="w-full">
                                                    {isAddingUni ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    Add University
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Student Center, Room 101"
                                    required
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]} // Block past dates
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details & Media */}
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-indigo-600" /> Media & Description
                    </h2>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tell people what to expect..."
                                required
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="poster">Event Poster</Label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative overflow-hidden group">
                                    <Input
                                        id="poster"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {file ? (
                                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-100">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-sm font-medium">Click to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-2 pointer-events-none">
                                            <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="text-sm font-medium">Click to upload</div>
                                            <div className="text-xs text-slate-500">SVG, PNG, JPG (Max 5MB)</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="regLink">Registration Link (Optional)</Label>
                                <Input
                                    id="regLink"
                                    value={formData.registrationLink}
                                    onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                                    placeholder="https://..."
                                    className="h-11"
                                />
                                <p className="text-xs text-slate-500">Provide a link if users need to register externally.</p>
                            </div>

                            <div className="flex items-center space-x-2 p-4 rounded-lg border bg-slate-50 dark:bg-slate-900">
                                <input
                                    type="checkbox"
                                    id="restrictToUniversity"
                                    checked={formData.restrictToUniversity}
                                    onChange={(e) => setFormData({ ...formData, restrictToUniversity: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="restrictToUniversity" className="cursor-pointer font-medium">
                                    Restrict to {formData.university} students only
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Societies */}
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" /> Organizer
                    </h2>
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setEventType("unofficial")}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${eventType === "unofficial" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                Unofficial / Personal
                            </button>
                            <button
                                type="button"
                                onClick={() => setEventType("official")}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${eventType === "official" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                Official Society Event
                            </button>
                        </div>

                        {eventType === "official" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <Label>Select Hosting Society</Label>
                                    <Dialog open={isAddSocietyOpen} onOpenChange={setIsAddSocietyOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" /> Add Society
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Society</DialogTitle>
                                                <DialogDescription>Create a new society/club.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Society Name *</Label>
                                                    <Input
                                                        value={newSocietyData.name}
                                                        onChange={(e) => setNewSocietyData({ ...newSocietyData, name: e.target.value })}
                                                        placeholder="e.g., Tech Society"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description *</Label>
                                                    <Textarea
                                                        value={newSocietyData.description}
                                                        onChange={(e) => setNewSocietyData({ ...newSocietyData, description: e.target.value })}
                                                        placeholder="Briefly describe the society..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>President Name</Label>
                                                        <Input
                                                            value={newSocietyData.presidentName}
                                                            onChange={(e) => setNewSocietyData({ ...newSocietyData, presidentName: e.target.value })}
                                                            placeholder="President"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Vice President</Label>
                                                        <Input
                                                            value={newSocietyData.vicePresidentName}
                                                            onChange={(e) => setNewSocietyData({ ...newSocietyData, vicePresidentName: e.target.value })}
                                                            placeholder="Vice President"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Convener Name</Label>
                                                    <Input
                                                        value={newSocietyData.convenerName}
                                                        onChange={(e) => setNewSocietyData({ ...newSocietyData, convenerName: e.target.value })}
                                                        placeholder="Faculty Convener"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>University</Label>
                                                    <Select
                                                        value={newSocietyData.university}
                                                        onValueChange={(value) => setNewSocietyData({ ...newSocietyData, university: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select University" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {universities?.map((uni: any) => (
                                                                <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleAddSociety}
                                                disabled={!newSocietyData.name.trim() || !newSocietyData.description.trim() || isAddingSociety}
                                                className="w-full"
                                            >
                                                {isAddingSociety && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Society
                                            </Button>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {societies && societies.length > 0 ? societies.map((society: Society) => (
                                        <button
                                            key={society.id}
                                            type="button"
                                            onClick={() => toggleSociety(society.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSocieties.includes(society.id)
                                                ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                        >
                                            {society.name}
                                        </button>
                                    )) : <span className="text-sm text-slate-500">No societies found. Click 'Add Society' to create one.</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}

                <div className="flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={() => router.back()} size="lg">Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish Event
                    </Button>
                </div>
            </form>
        </div>
    );
}
