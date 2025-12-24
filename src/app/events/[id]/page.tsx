"use client";

import { useEffect, useState } from "react";
import { getEventById, toggleRsvp } from "@/lib/services";
import { getFileView } from "@/lib/storage";
import { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Loader2, Share2, Users, Clock, AlertCircle, Check, Eye, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteEvent } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import React from "react";

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);

    // RSVP State
    const [isGoing, setIsGoing] = useState(false);
    const [isRsvpLoading, setIsRsvpLoading] = useState(false);

    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', id],
        queryFn: () => getEventById(id),
    });

    useEffect(() => {
        if (event && user && event.attendeeIds) {
            setIsGoing(event.attendeeIds.includes(user.uid));
        }
    }, [event, user]);

    const handleRsvp = async () => {
        if (!user) {
            router.push("/login");
            return;
        }
        if (!event) return;
        if (user.uid === event.organizerId) return;

        setIsRsvpLoading(true);
        // Optimistic
        const previousState = isGoing;
        setIsGoing(!previousState);

        try {
            await toggleRsvp(event.id, user.uid, event.attendeeIds || []);
            await queryClient.invalidateQueries({ queryKey: ['event', id] });
            await queryClient.invalidateQueries({ queryKey: ['events'] });
        } catch (error) {
            setIsGoing(previousState);
            console.error("RSVP Failure", error);
        } finally {
            setIsRsvpLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        setIsDeleting(true);
        try {
            await deleteEvent(id);
            router.push("/");
        } catch (error) {
            alert("Failed to delete event.");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Event Not Found</h2>
                <p className="text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
                <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    const dateObj = new Date(event.date);
    const imageUrl = event.imageUrl || (event.imageId ? getFileView(event.imageId) : null);
    const isOrganizer = user?.uid === event.organizerId;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                {imageUrl ? (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
                        <img
                            src={imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50" />
                        <Calendar className="h-24 w-24 text-white/20 relative z-10" />
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 z-20 container py-12">
                    <div className="flex gap-2">
                        <Badge className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white border-0 text-sm px-3 py-1">
                            {event.category}
                        </Badge>
                        {event.university && (
                            <Badge className="mb-4 bg-white/20 hover:bg-white/30 text-white border-0 text-sm px-3 py-1 backdrop-blur-md">
                                {event.university}
                            </Badge>
                        )}
                    </div>

                    {event.societies && event.societies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {event.societies.map(s => (
                                <Badge key={s.id} variant="secondary" className="text-xs bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm">
                                    {s.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                        {event.title}
                    </h1>
                </div>
            </div>

            <div className="container -mt-8 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        {isOrganizer && (
                            <div className="flex gap-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                <Button variant="outline" className="flex-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900" onClick={() => router.push(`/events/${id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Event
                                </Button>
                                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" /> Delete Event</>}
                                </Button>
                            </div>
                        )}
                        <div className="flex flex-col gap-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                About this Event
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-lg">
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hosting Societies</h3>
                            {event.societies && event.societies.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {event.societies.map(s => (
                                        <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                                            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                                <p className="text-sm text-slate-500">{s.presidentName} (President)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No specific society linked.</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden sticky top-24">
                            <div className="p-6 space-y-6">
                                {/* Date Block */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center min-w-[80px]">
                                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                            {dateObj.toLocaleString('default', { month: 'short' })}
                                        </div>
                                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                            {dateObj.getDate()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Clock className="h-4 w-4" />
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <span className="text-sm">{dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Location Block */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                                        <MapPin className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white mb-0.5">Location</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-snug">{event.location}</p>
                                    </div>
                                </div>

                                {/* Attendees Block with Dialog */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className={cn("flex items-start gap-4 p-2 -mx-2 rounded-lg transition-colors cursor-pointer", isOrganizer && "hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                            <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                                                <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white mb-0.5 flex items-center gap-2">
                                                    Attendees
                                                    {isOrganizer && <Badge variant="outline" className="text-[10px] h-5">View</Badge>}
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm">{event.rsvps} people going</p>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    {isOrganizer && (
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Attendee List</DialogTitle>
                                                <DialogDescription>
                                                    List of users who have RSVP'd to this event.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                                                {event.attendeeIds && event.attendeeIds.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {event.attendeeIds.map((uid, i) => (
                                                            <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                                    U{i + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">User ID: {uid}</p>
                                                                    <p className="text-xs text-slate-500">Attendee</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-slate-500">
                                                        No attendees yet.
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </DialogContent>
                                    )}
                                </Dialog>

                                <div className="pt-4 space-y-3">
                                    {event.registrationLink && (
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]" asChild>
                                            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                                                Register Now <LinkIcon className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}

                                    <Button
                                        className={cn(
                                            "w-full text-lg py-6 transition-all hover:scale-[1.02]",
                                            isGoing ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
                                            event.registrationLink && !isGoing ? "border-2 border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800" : ""
                                        )}
                                        disabled={event.isPast || isOrganizer || isRsvpLoading}
                                        onClick={handleRsvp}
                                    >
                                        {isRsvpLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : isOrganizer ? (
                                            "Hosting Event"
                                        ) : event.isPast ? (
                                            "Event Ended"
                                        ) : isGoing ? (
                                            <><Check className="mr-2 h-5 w-5" /> Going (Click to remove)</>
                                        ) : (
                                            "Count Me In"
                                        )}
                                    </Button>
                                    <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700">
                                        <Share2 className="mr-2 h-4 w-4" /> Share Event
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
