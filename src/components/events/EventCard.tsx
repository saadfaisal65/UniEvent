import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { toggleRsvp } from "@/lib/services";
import { useRouter } from "next/navigation";

export interface EventProps {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    category: string;
    imageUrl?: string;
    rsvps: number;
    isPast?: boolean;
    university?: string;
    organizerId?: string;
    attendeeIds?: string[];
}

export function EventCard({ event }: { event: EventProps }) {
    const { user } = useAuth();
    const router = useRouter();
    const dateObj = new Date(event.date);
    const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

    const [isGoing, setIsGoing] = useState(false);
    const [rsvpCount, setRsvpCount] = useState(event.rsvps);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user && event.attendeeIds) {
            setIsGoing(event.attendeeIds.includes(user.uid));
        }
    }, [user, event.attendeeIds]);

    useEffect(() => {
        setRsvpCount(event.rsvps);
    }, [event.rsvps]);

    const handleRsvp = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (!user) {
            router.push("/login");
            return;
        }

        if (user.uid === event.organizerId) return;

        setIsLoading(true);
        // Optimistic update
        const previousState = isGoing;
        const previousCount = rsvpCount;

        setIsGoing(!previousState);
        setRsvpCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            await toggleRsvp(event.id, user.uid, event.attendeeIds || []);
        } catch (error) {
            // Revert on error
            setIsGoing(previousState);
            setRsvpCount(previousCount);
            console.error("RSVP failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isOrganizer = user?.uid === event.organizerId;

    return (
        <Link href={`/events/${event.id}`} className="block h-full transition-transform hover:scale-[1.02]">
            <Card className={cn("overflow-hidden flex flex-col h-full transition-all hover:shadow-lg cursor-pointer", event.isPast && "opacity-75 grayscale hover:grayscale-0 hover:opacity-100")}>
                <div className="relative h-48 w-full bg-slate-900 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        {event.imageUrl ? (
                            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-contain" />
                        ) : (
                            <Calendar className="h-12 w-12 opacity-20" />
                        )}
                    </div>
                    <Badge className="absolute top-2 right-2 bg-white/90 text-black shadow-sm" variant="secondary">
                        {event.category}
                    </Badge>
                    {event.university && (
                        <Badge className="absolute top-2 left-2 bg-indigo-600/90 text-white shadow-sm border-0" variant="secondary">
                            {event.university}
                        </Badge>
                    )}
                </div>
                <CardHeader>
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formattedDate}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {event.location}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t py-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Users className="h-3 w-3" /> {rsvpCount} going
                    </div>
                    {!event.isPast && !isOrganizer && (
                        <Button
                            size="sm"
                            variant={isGoing ? "secondary" : "default"}
                            className={cn(isGoing && "bg-green-100 text-green-700 hover:bg-green-200")}
                            disabled={isLoading}
                            onClick={handleRsvp}
                        >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : isGoing ? <Check className="h-3 w-3 mr-1" /> : null}
                            {isGoing ? "Going" : "Count Me In"}
                        </Button>
                    )}
                    {isOrganizer && (
                        <Badge variant="outline" className="border-indigo-200 text-indigo-600">Hosting</Badge>
                    )}
                    {event.isPast && (
                        <Button size="sm" variant="outline" disabled>Ended</Button>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
