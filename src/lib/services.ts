import { databases } from "./appwrite";
import { ID, Query } from "appwrite";
import { Event, Society, Venue } from "./types";
import { getFileView, deleteFile } from "./storage";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID!;
const SOCIETIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID || "societies";
const VENUES_COLLECTION_ID = "venues";

export async function getSocieties(): Promise<Society[]> {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            SOCIETIES_COLLECTION_ID
        );
        return response.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            logoUrl: doc.logoUrl,
            presidentName: doc.presidentName,
            vicePresidentName: doc.vicePresidentName,
            convenerName: doc.convenerName,
            createdBy: doc.createdBy,
            university: doc.university
        }));
    } catch (error) {
        console.error("Error fetching societies:", error);
        return [];
    }
}

export async function createSociety(data: Omit<Society, "id">): Promise<Society> {
    try {
        const doc: any = await databases.createDocument(DATABASE_ID, SOCIETIES_COLLECTION_ID, ID.unique(), data);
        return {
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            logoUrl: doc.logoUrl,
            presidentName: doc.presidentName,
            vicePresidentName: doc.vicePresidentName,
            convenerName: doc.convenerName,
            createdBy: doc.createdBy,
            university: doc.university
        };
    } catch (error) {
        console.error("Error adding society:", error);
        throw error;
    }
}

export async function getVenues(university?: string): Promise<Venue[]> {
    try {
        const queries = [Query.limit(100)];
        if (university && university !== "Global") {
            queries.push(Query.equal("university", university));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            VENUES_COLLECTION_ID,
            queries
        );

        return response.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
            university: doc.university,
            capacity: doc.capacity
        }));
    } catch (error) {
        console.error("Error fetching venues:", error);
        return [];
    }
}

export async function checkVenueAvailability(venueId: string, dateStr: string, durationMinutes: number, currentEventId?: string): Promise<boolean> {
    try {
        const targetStart = new Date(dateStr).getTime();
        const targetEnd = targetStart + durationMinutes * 60 * 1000;

        const response = await databases.listDocuments(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            [
                Query.equal("venueId", venueId)
            ]
        );

        for (const doc of response.documents) {
            if (currentEventId && doc.$id === currentEventId) continue;

            const eventStart = new Date(doc.date).getTime();
            const eventDuration = doc.duration || 60;
            const eventEnd = eventStart + eventDuration * 60 * 1000;

            if (targetStart < eventEnd && targetEnd > eventStart) {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error("Error checking availability:", error);
        return true;
    }
}

export async function getEvents(): Promise<Event[]> {
    try {
        const [eventsResponse, societies] = await Promise.all([
            databases.listDocuments(
                DATABASE_ID,
                EVENTS_COLLECTION_ID,
                [Query.orderAsc("date")]
            ),
            getSocieties()
        ]);

        const societyMap = new Map(societies.map(s => [s.id, s]));

        return eventsResponse.documents.map((doc: any) => {
            const eventSocieties = (doc.societies || []).map((id: string) => societyMap.get(id)).filter((s: any) => s !== undefined);

            return {
                id: doc.$id,
                title: doc.title,
                date: doc.date,
                location: doc.location,
                description: doc.description,
                category: doc.category,
                imageUrl: doc.imageUrl || (doc.imageId ? getFileView(doc.imageId) : undefined),
                imageId: doc.imageId,
                rsvps: doc.rsvps,
                organizerId: doc.organizerId,
                university: doc.university,
                isPast: new Date(doc.date) < new Date(),
                registrationLink: doc.registrationLink,
                societies: eventSocieties,
                attendeeIds: doc.attendeeIds || [],
                restrictToUniversity: doc.restrictToUniversity || false,
                duration: doc.duration,
                venueId: doc.venueId
            };

        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function addEvent(eventData: Omit<Event, "id" | "rsvps" | "isPast"> & { societyIds?: string[] }): Promise<void> {
    try {
        const { societyIds, ...data } = eventData;
        
        // Validate Venue Availability
        if (data.venueId && data.duration) {
             const isAvailable = await checkVenueAvailability(data.venueId, data.date, data.duration);
             if (!isAvailable) {
                 throw new Error("The selected venue is invalid or already booked for this time slot.");
             }
        }

        await databases.createDocument(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            ID.unique(),
            {
                ...data,
                rsvps: 0,
                societies: societyIds,
                attendeeIds: []
            }
        );
    } catch (error) {
        console.error("Error adding event:", error);
        throw error;
    }
}

export async function updateEvent(id: string, eventData: Partial<Event> & { societyIds?: string[] }): Promise<void> {
    try {
        const { societyIds, ...data } = eventData;
        const { id: _, isPast: __, rsvps: ___, societies: ____, ...cleanData } = data as any;

        // If venue, date or duration is changing, validation is needed.
        if (data.venueId || data.date || data.duration) {
            const currentEvent = await getEventById(id);
            if (currentEvent) { 
                 const checkVenue = data.venueId || currentEvent.venueId;
                 const checkDate = data.date || currentEvent.date;
                 const checkDuration = data.duration || currentEvent.duration || 60;
                 
                 if (checkVenue) {
                     const isAvailable = await checkVenueAvailability(checkVenue, checkDate, checkDuration, id);
                     if (!isAvailable) throw new Error("Venue conflict : The venue is booked.");
                 }
            }
        }

        const payload: any = { ...cleanData };
        if (societyIds) payload.societies = societyIds;

        await databases.updateDocument(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            id,
            payload
        );
    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
}

export async function deleteEvent(id: string): Promise<void> {
    try {
        const doc = await databases.getDocument(DATABASE_ID, EVENTS_COLLECTION_ID, id);
        if (doc.imageId) {
            await deleteFile(doc.imageId);
        }
        await databases.deleteDocument(DATABASE_ID, EVENTS_COLLECTION_ID, id);
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
}

export async function toggleRsvp(eventId: string, userId: string, currentAttendeeIds: string[]): Promise<string[]> {
    try {
        let newAttendeeIds = [...currentAttendeeIds];
        if (newAttendeeIds.includes(userId)) {
            newAttendeeIds = newAttendeeIds.filter(id => id !== userId);
        } else {
            newAttendeeIds.push(userId);
        }

        await databases.updateDocument(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            eventId,
            {
                attendeeIds: newAttendeeIds,
                rsvps: newAttendeeIds.length
            }
        );
        return newAttendeeIds;
    } catch (error) {
        console.error("Error toggling RSVP:", error);
        throw error;
    }
}

export async function getEventById(id: string): Promise<Event | null> {
    try {
        const [doc, societies] = await Promise.all([
            databases.getDocument(DATABASE_ID, EVENTS_COLLECTION_ID, id),
            getSocieties()
        ]);

        const societyMap = new Map(societies.map(s => [s.id, s]));
        const eventSocieties = (doc.societies || []).map((sid: string) => societyMap.get(sid)).filter((s: any) => s !== undefined);

        return {
            id: doc.$id,
            title: doc.title,
            date: doc.date,
            location: doc.location,
            description: doc.description,
            category: doc.category,
            imageUrl: doc.imageUrl || (doc.imageId ? getFileView(doc.imageId) : undefined),
            imageId: doc.imageId,
            rsvps: doc.rsvps,
            organizerId: doc.organizerId,
            university: doc.university,
            isPast: new Date(doc.date) < new Date(),
            registrationLink: doc.registrationLink,
            societies: eventSocieties,
            attendeeIds: doc.attendeeIds || [],
            restrictToUniversity: doc.restrictToUniversity || false,
            duration: doc.duration,
            venueId: doc.venueId
        };
    } catch (error) {
        console.error("Error fetching event:", error);
        return null;
    }
}


export interface University {
    id: string;
    name: string;
    location?: string;
}

const UNIV_COLLECTION_ID = "universities";

export async function getUniversities(): Promise<University[]> {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            UNIV_COLLECTION_ID,
            [Query.limit(100), Query.orderAsc("name")]
        );
        return response.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
            location: doc.location
        }));
    } catch (error) {
        console.error("Error fetching universities:", error);
        return [];
    }
}


export interface Category {
    id: string;
    name: string;
}

const CAT_COLLECTION_ID = "categories";

export async function getCategories(): Promise<Category[]> {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            CAT_COLLECTION_ID,
            [Query.limit(100), Query.orderAsc("name")]
        );
        return response.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name
        }));
    } catch (error) {
        console.warn("Error fetching categories:", error);
        // Fallback
        return ["Tech", "Music", "Career", "Social", "Arts", "Sports", "Workshops", "Hackathons"].map(name => ({ id: name.toLowerCase(), name }));
    }
}

export async function createCategory(name: string): Promise<Category> {
    const doc = await databases.createDocument(DATABASE_ID, CAT_COLLECTION_ID, ID.unique(), { name });
    return { id: doc.$id, name: doc.name };
}

export async function deleteCategory(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, CAT_COLLECTION_ID, id);
}

export async function updateSociety(id: string, data: Partial<Society>): Promise<void> {
    try {
        const { id: _, ...payload } = data as any;
        await databases.updateDocument(DATABASE_ID, SOCIETIES_COLLECTION_ID, id, payload);
    } catch (error) {
        console.error("Error updating society:", error);
        throw error;
    }
}

export async function deleteSociety(id: string): Promise<void> {
    try {
        // First, get all events associated with this society
        const eventsResponse = await databases.listDocuments(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            [Query.contains('societies', id)]
        );

        // Delete all associated events
        for (const event of eventsResponse.documents) {
            await deleteEvent(event.$id);
        }

        // Then delete the society
        await databases.deleteDocument(DATABASE_ID, SOCIETIES_COLLECTION_ID, id);
    } catch (error) {
        console.error("Error deleting society:", error);
        throw error;
    }
}


export async function createUniversity(name: string): Promise<University> {
    try {
        const doc = await databases.createDocument(
            DATABASE_ID,
            UNIV_COLLECTION_ID,
            ID.unique(),
            { name }
        );
        return {
            id: doc.$id,
            name: doc.name,
            location: doc.location
        };
    } catch (error) {
        console.error("Error creating university:", error);
        throw error;
    }
}

// --- Admin & Roles Logic ---

const USERS_COLL_ID = 'users_roles';
const REQ_COLL_ID = 'admin_requests';

export interface UserRole {
    id: string; // Document ID
    userId: string;
    email: string;
    isAdmin: boolean;
    university?: string;
}

export interface AdminRequest {
    id: string;
    userId: string;
    userName: string;
    email: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

export async function ensureUserProfile(userId: string, email: string, university?: string): Promise<UserRole | null> {
    try {
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLL_ID, [Query.equal('userId', userId)]);
        if (response.documents.length > 0) {
            const doc = response.documents[0];
            return {
                id: doc.$id,
                userId: doc.userId,
                email: doc.email,
                isAdmin: doc.isAdmin,
                university: doc.university
            };
        } else {
            // Create New
            const doc = await databases.createDocument(DATABASE_ID, USERS_COLL_ID, ID.unique(), {
                userId, email, isAdmin: true, university: university || 'Global'
            });
            return {
                id: doc.$id,
                userId: doc.userId,
                email: doc.email,
                isAdmin: doc.isAdmin,
                university: doc.university
            };
        }
    } catch (e) {
        console.error("Error ensuring user profile", e);
        return null; // Fail safe
    }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
    try {
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLL_ID, [Query.equal('userId', userId)]);
        if (response.documents.length > 0) {
            const doc = response.documents[0];
            return {
                id: doc.$id,
                userId: doc.userId,
                email: doc.email,
                isAdmin: doc.isAdmin
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function submitAdminRequest(userId: string, userName: string, email: string, reason: string, secretCode?: string): Promise<void> {
    // Secret backdoor for testing
    if (secretCode === "admin123") {
        // Upgrade immediately
        const roleDoc = await getUserRole(userId);
        if (roleDoc) {
            await databases.updateDocument(DATABASE_ID, USERS_COLL_ID, roleDoc.id, { isAdmin: true });
        }
        return;
    }

    // Check if pending request exists
    const existing = await databases.listDocuments(DATABASE_ID, REQ_COLL_ID, [Query.equal('userId', userId), Query.equal('status', 'pending')]);
    if (existing.total > 0) throw new Error("Request already pending");

    await databases.createDocument(DATABASE_ID, REQ_COLL_ID, ID.unique(), {
        userId, userName, email, reason, status: 'pending'
    });
}

export async function getAdminRequests(): Promise<AdminRequest[]> {
    const response = await databases.listDocuments(DATABASE_ID, REQ_COLL_ID, [Query.equal('status', 'pending')]);
    return response.documents.map((doc: any) => ({
        id: doc.$id,
        userId: doc.userId,
        userName: doc.userName,
        email: doc.email,
        reason: doc.reason,
        status: doc.status
    }));
}

export async function approveAdminRequest(requestId: string, userId: string): Promise<void> {
    // 1. Update Request Status
    await databases.updateDocument(DATABASE_ID, REQ_COLL_ID, requestId, { status: 'approved' });

    // 2. Update User Role
    const roleDoc = await getUserRole(userId);
    if (roleDoc) {
        await databases.updateDocument(DATABASE_ID, USERS_COLL_ID, roleDoc.id, { isAdmin: true });
    }
}

export async function rejectAdminRequest(requestId: string): Promise<void> {
    await databases.updateDocument(DATABASE_ID, REQ_COLL_ID, requestId, { status: 'rejected' });
}
