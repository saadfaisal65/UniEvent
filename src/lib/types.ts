export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAdmin?: boolean;
    university?: string;
}

export interface Society {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    presidentName: string;
    vicePresidentName: string;
    convenerName: string;
    createdBy?: string;
    university: string;
}

export interface Venue {
    id: string;
    name: string;
    university: string;
    capacity: number;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    category: string;
    imageUrl?: string;
    imageId?: string;
    rsvps: number;
    organizerId: string;
    registrationLink?: string;
    societies?: Society[];
    attendeeIds: string[];
    restrictToUniversity?: boolean;
    duration?: number;
    venueId?: string;
    university?: string;
    isPast?: boolean;
}


