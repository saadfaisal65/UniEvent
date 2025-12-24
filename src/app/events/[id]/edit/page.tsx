"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getEventById, updateEvent, getSocieties } from "@/lib/services";
import { uploadFile, getFilePreview, deleteFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, CalendarDays, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Society } from "@/lib/types";
import React from "react";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [error, setError] = useState("");
    const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For existing image
    const [eventType, setEventType] = useState<"official" | "unofficial">("unofficial");

    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        location: "",
        category: "",
        description: "",
        registrationLink: "",
        university: "Global",
    });

    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => getEventById(id),
    });

    const { data: societies } = useQuery({
        queryKey: ['societies'],
        queryFn: getSocieties
    });

    // Populate form when event loads
    useEffect(() => {
        if (event) {
            const dateObj = new Date(event.date);
            // Format date to YYYY-MM-DD
            const isoDate = dateObj.toISOString().split('T')[0];
            // Format time to HH:mm
            const isoTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            setFormData({
                title: event.title,
                date: isoDate,
                time: isoTime,
                location: event.location,
                category: event.category,
                description: event.description,
                registrationLink: event.registrationLink || "",
                university: event.university || "Global",
            });

            if (event.imageUrl) {
                setPreviewUrl(event.imageUrl);
            }
            if (event.societies && event.societies.length > 0) {
                setEventType("official");
                setSelectedSocieties(event.societies.map(s => s.id));
            } else {
                setEventType("unofficial");
            }
        }
    }, [event]);

    // Check ownership
    useEffect(() => {
        if (!authLoading && user && event && user.uid !== event.organizerId) {
            // Not authorized
            router.push(`/events/${id}`);
        }
    }, [user, event, authLoading, router, id]);


    const mutation = useMutation({
        mutationFn: async (data: any) => {
            let imageId = undefined;
            if (file) {
                imageId = await uploadFile(file);
            }

            await updateEvent(id, { ...data, imageId });

            // If update successful and we uploaded a new file, delete the old one
            if (file && event?.imageId) {
                await deleteFile(event.imageId);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['event', id] });
            await queryClient.invalidateQueries({ queryKey: ['events'] });
            router.push(`/events/${id}`);
        },
        onError: () => {
            setError("Failed to update event. Please try again.");
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

        mutation.mutate({
            title: formData.title,
            date: dateTime,
            location: formData.location,
            category: formData.category,
            description: formData.description,
            registrationLink: formData.registrationLink,
            university: formData.university,
            societyIds: eventType === "official" ? selectedSocieties : [],
        });
    };

    const toggleSociety = (id: string) => {
        setSelectedSocieties(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    if (authLoading || eventLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) return null; // Should redirect via auth context/useEffect

    return (
        <div className="max-w-4xl mx-auto py-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Event</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Update the details of your event below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Same form layout as CreateEventPage but pre-filled */}
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
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tech">Tech</SelectItem>
                                        <SelectItem value="Music">Music</SelectItem>
                                        <SelectItem value="Career">Career</SelectItem>
                                        <SelectItem value="Social">Social</SelectItem>
                                        <SelectItem value="Arts">Arts</SelectItem>
                                        <SelectItem value="Sports">Sports</SelectItem>
                                        <SelectItem value="Workshops">Workshops</SelectItem>
                                        <SelectItem value="Hackathons">Hackathons</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="university">University / Institution</Label>
                                <Input
                                    id="university"
                                    value={formData.university}
                                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                    placeholder="e.g. Harvard University (or 'Global')"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setFile(e.target.files[0]);
                                                setPreviewUrl(null); // Clear ID preview if new file
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {file ? (
                                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-100">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : previewUrl ? (
                                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-100">
                                            <img
                                                src={previewUrl}
                                                alt="Existing"
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
                                            <div className="text-sm font-medium">Click to replace</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="regLink">Registration Link</Label>
                                <Input
                                    id="regLink"
                                    value={formData.registrationLink}
                                    onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </div>
                </div>

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
                                Unofficial
                            </button>
                            <button
                                type="button"
                                onClick={() => setEventType("official")}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${eventType === "official" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                Official Society
                            </button>
                        </div>

                        {eventType === "official" && (
                            <div className="flex flex-wrap gap-2">
                                {societies && societies.map((society: Society) => (
                                    <button
                                        key={society.id}
                                        type="button"
                                        onClick={() => toggleSociety(society.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSocieties.includes(society.id)
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800"
                                            }`}
                                    >
                                        {society.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={() => router.back()} size="lg">Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
