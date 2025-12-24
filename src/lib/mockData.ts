import { EventProps } from "@/components/events/EventCard";

export const MOCK_EVENTS: EventProps[] = [
    {
        id: "1",
        title: "Hackathon 2024: Code the Future",
        date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        location: "Student Center Hall A",
        description: "Join us for a 48-hour coding sprint to build innovative solutions for campus life.",
        category: "Tech",
        rsvps: 120,
        isPast: false,
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=1000",
    },
    {
        id: "2",
        title: "Music Under the Stars",
        date: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
        location: "Campus Green",
        description: "Relax with live acoustic performances by student bands.",
        category: "Music",
        rsvps: 85,
        isPast: false,
        imageUrl: "https://images.unsplash.com/photo-1459749411177-046f52bb1952?auto=format&fit=crop&q=80&w=1000",
    },
    {
        id: "3",
        title: "Career Fair: Spring Edition",
        date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        location: "Main Gymnasium",
        description: "Meet recruiters from top tech companies and startups.",
        category: "Career",
        rsvps: 300,
        isPast: false,
        imageUrl: "https://images.unsplash.com/photo-1559523161-0fc0d8b673c4?auto=format&fit=crop&q=80&w=1000",
    },
    {
        id: "4",
        title: "Winter Gala 2023",
        date: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
        location: "Grand Ballroom",
        description: "A night of elegance and celebration to end the semester.",
        category: "Social",
        rsvps: 450,
        isPast: true,
        imageUrl: "https://images.unsplash.com/photo-1514525253440-b393452de23e?auto=format&fit=crop&q=80&w=1000",
    },
    {
        id: "5",
        title: "Intro to AI Workshop",
        date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        location: "Room 304, Science Block",
        description: "Learn the basics of Neural Networks and Machine Learning.",
        category: "Tech",
        rsvps: 45,
        isPast: true,
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
    },
];
