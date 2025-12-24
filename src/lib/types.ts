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

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    category: string;
    imageUrl?: string;
    imageId?: string; // Appwrite Storage File ID
    rsvps: number;
    organizerId?: string;
    isPast?: boolean;
    registrationLink?: string;
    societies?: Society[]; // Array of Society objects
    university?: string;
    attendeeIds?: string[];
    restrictToUniversity?: boolean;
}
