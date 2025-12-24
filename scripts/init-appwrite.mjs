import { Client, Databases, Storage, Query, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local or .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Must be added by user
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID; // Can be a specific ID or we create one
const EVENTS_COLL_ID = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID || 'events';
const SOCIETIES_COLL_ID = process.env.NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID || 'societies';
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'event-posters';

if (!PROJECT_ID || !API_KEY) {
    console.error('❌ Error: Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in environment variables.');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function main() {
    console.log('🚀 Starting Appwrite Initialization...');

    // 1. Database
    let dbId = DB_ID;
    if (!dbId) {
        console.log('ℹ️ No Database ID in env. Creating new database "UniEventDB"...');
        try {
           const db = await databases.create('unievent_db', 'UniEventDB');
           dbId = db.$id;
           console.log(`✅ Database created: ${dbId}`);
           console.log('⚠️ Please add NEXT_PUBLIC_APPWRITE_DATABASE_ID=' + dbId + ' to your .env');
        } catch (e) {
            console.error('❌ Failed to create database:', e.message);
            process.exit(1);
        }
    } else {
        try {
            await databases.get(dbId);
            console.log(`✅ Database connected: ${dbId}`);
        } catch (e) {
            console.log(`ℹ️ Database ${dbId} not found. Creating...`);
             const db = await databases.create(dbId, 'UniEventDB');
             console.log(`✅ Database created: ${dbId}`);
        }
    }


    // 0. RESET DATA (If requested)
    console.log('🧹 Cleaning up database and storage...');
    try {
        const resetCollections = [EVENTS_COLL_ID, SOCIETIES_COLL_ID, 'universities', 'categories'];
        for (const cid of resetCollections) {
            try {
                const docs = await databases.listDocuments(dbId, cid);
                for (const d of docs.documents) {
                    await databases.deleteDocument(dbId, cid, d.$id);
                }
                console.log(`   ✅ Cleared ${cid}`);
            } catch (e) { /* ignore if coll doesn't exist */ }
        }
        
        // Clear Storage
        try {
            const files = await storage.listFiles(BUCKET_ID);
            for (const f of files.files) {
                await storage.deleteFile(BUCKET_ID, f.$id);
            }
             console.log(`   ✅ Cleared storage bucket`);
        } catch (e) { /* ignore */ }

    } catch(e) { console.error('Error during cleanup:', e.message); }

    // 2. Societies Collection
    try {
        await createCollection(dbId, SOCIETIES_COLL_ID, 'Societies', [
            { type: 'string', key: 'name', size: 256, required: true },
            { type: 'string', key: 'description', size: 5000, required: true },
            { type: 'url', key: 'logoUrl', required: false },
            { type: 'string', key: 'presidentName', size: 256, required: false },
            { type: 'string', key: 'vicePresidentName', size: 256, required: false },
            { type: 'string', key: 'convenerName', size: 256, required: false },
            { type: 'string', key: 'createdBy', size: 256, required: false },
        ]);
        
        // Seed Societies
        const records = await databases.listDocuments(dbId, SOCIETIES_COLL_ID);
        if (records.total === 0) {
            console.log('🌱 Seeding Societies...');
            const societies = [
                { name: "Tech Society", description: "Innovating the future.", presidentName: "Alice", vicePresidentName: "Bob", convenerName: "Dr. Smith", createdBy: "system" },
                { name: "Music Club", description: "Rhythms of campus.", presidentName: "Charlie", vicePresidentName: "David", convenerName: "Prof. Jones", createdBy: "system" },
                { name: "Debating Union", description: "Voices that matter.", presidentName: "Eve", vicePresidentName: "Frank", convenerName: "Mrs. Wilson", createdBy: "system" }
            ];
            for (const s of societies) {
                await databases.createDocument(dbId, SOCIETIES_COLL_ID, ID.unique(), s);
            }
        }
    } catch (e) {
        console.error('Error with Societies:', e.message);
    }

    // 3. Events Collection
    try {
        await createCollection(dbId, EVENTS_COLL_ID, 'Events', [
            { type: 'string', key: 'title', size: 256, required: true },
            { type: 'datetime', key: 'date', required: true },
            { type: 'string', key: 'location', size: 256, required: true },
            { type: 'string', key: 'description', size: 5000, required: true },
            { type: 'string', key: 'category', size: 50, required: true },
            { type: 'url', key: 'imageUrl', required: false },
            { type: 'string', key: 'imageId', size: 256, required: false },
            { type: 'integer', key: 'rsvps', required: false, default: 0 },
            { type: 'string', key: 'organizerId', size: 256, required: true },
            { type: 'url', key: 'registrationLink', required: false },
            { type: 'string', key: 'societies', size: 256, required: false, array: true },
            { type: 'string', key: 'university', size: 128, required: false, default: "Global" },
            { type: 'string', key: 'attendeeIds', size: 256, required: false, array: true },
        ]);
        
        // Add Indexes for Events
        await createIndex(dbId, EVENTS_COLL_ID, 'date_idx', 'key', ['date'], ['ASC']);
        await createIndex(dbId, EVENTS_COLL_ID, 'university_idx', 'key', ['university'], ['ASC']);
        await createIndex(dbId, EVENTS_COLL_ID, 'category_idx', 'key', ['category'], ['ASC']);
    } catch (e) { console.error('Error with Events:', e.message); }


    // 4. Storage Bucket
    try {
        await storage.getBucket(BUCKET_ID);
        console.log(`✅ Storage Bucket connected: ${BUCKET_ID}`);
    } catch (error) {
         if (error.code === 404) {
            console.log(`ℹ️ Creating Storage Bucket ${BUCKET_ID}...`);
            await storage.createBucket(BUCKET_ID, 'Event Posters', [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())], true, undefined, undefined, ['jpg', 'png', 'webp', 'jpeg']);
             console.log(`✅ Storage Bucket created.`);
         } else {
             console.error('❌ Storage Bucket Error:', error.message);
         }
    }

    // 5. Universities Collection
    const UNIV_COLL_ID = 'universities';
    try {
        await createCollection(dbId, UNIV_COLL_ID, 'Universities', [
            { type: 'string', key: 'name', size: 128, required: true },
            { type: 'string', key: 'location', size: 128, required: false },
        ]);
        
        // Seed default universities if empty (which it will be after wipe)
        const records = await databases.listDocuments(dbId, UNIV_COLL_ID);
        if (records.total === 0) {
            console.log('🌱 Seeding Universities...');
            const unis = ["Global", "Harvard University", "Stanford University", "MIT", "Oxford University", "National Textile University"];
            for (const name of unis) {
                await databases.createDocument(dbId, UNIV_COLL_ID, ID.unique(), { name });
            }
        }
    } catch (e) {
        console.error('Error with Universities:', e.message);
    }

    // 6. Categories Collection
    const CAT_COLL_ID = 'categories';
    try {
        await createCollection(dbId, CAT_COLL_ID, 'Categories', [
            { type: 'string', key: 'name', size: 64, required: true }
        ]);

        const records = await databases.listDocuments(dbId, CAT_COLL_ID);
        if (records.total === 0) {
            console.log('🌱 Seeding Categories...');
            const cats = ["Tech", "Music", "Career", "Social", "Arts", "Sports", "Workshops", "Hackathons"];
            for (const name of cats) {
                await databases.createDocument(dbId, CAT_COLL_ID, ID.unique(), { name });
            }
        }
    } catch (e) {
        console.error('Error with Categories:', e.message);
    }
    
    // 7. Users Collection (For Roles)
    const USERS_COLL_ID = 'users_roles';
    try {
        await createCollection(dbId, USERS_COLL_ID, 'User Roles', [
            { type: 'string', key: 'userId', size: 256, required: true },
            { type: 'string', key: 'email', size: 256, required: true },
            { type: 'boolean', key: 'isAdmin', required: false, default: false },
        ]);
        // Index for faster lookup by userId
        await createIndex(dbId, USERS_COLL_ID, 'userid_idx', 'key', ['userId'], ['ASC']);
    } catch (e) { console.error('Error with User Roles:', e.message); }

    // 8. Admin Requests Collection
    const REQ_COLL_ID = 'admin_requests';
    try {
        await createCollection(dbId, REQ_COLL_ID, 'Admin Requests', [
            { type: 'string', key: 'userId', size: 256, required: true },
            { type: 'string', key: 'userName', size: 256, required: true },
            { type: 'string', key: 'email', size: 256, required: true },
            { type: 'string', key: 'reason', size: 1000, required: true },
            { type: 'string', key: 'status', size: 50, required: false, default: 'pending' }, // pending, approved, rejected
        ]);
    } catch (e) { console.error('Error with Admin Requests:', e.message); }


    console.log('🎉 Appwrite Initialization Complete!');
}

async function createCollection(dbId, collId, name, attributes) {
//...
    try {
        await databases.getCollection(dbId, collId);
        console.log(`✅ Collection connected: ${name} (${collId})`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`ℹ️ Creating Collection ${name}...`);
            await databases.createCollection(dbId, collId, name, [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]);
        } else {
             console.error(`❌ Error checking collection ${name}:`, e.message);
             return;
        }
    }

    // Attributes
    for (const attr of attributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(dbId, collId, attr.key, attr.size, attr.required, attr.default, attr.array);
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(dbId, collId, attr.key, attr.required, 0, 1000000, attr.default, attr.array);
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(dbId, collId, attr.key, attr.required, attr.default, attr.array);
            } else if (attr.type === 'url') {
                await databases.createUrlAttribute(dbId, collId, attr.key, attr.required, attr.default, attr.array);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(dbId, collId, attr.key, attr.required, attr.default, attr.array);
            }
             console.log(`   🔹 Attribute checked/created: ${attr.key}`);
            // Wait a bit because attribute creation is async/queued in Appwrite
            await new Promise(r => setTimeout(r, 500)); 
        } catch (e) {
            if (e.code === 409) {
                // Attribute already exists, ignore
            } else {
                console.warn(`   ⚠️ Error creating attribute ${attr.key}:`, e.message);
            }
        }
    }
}

async function createIndex(dbId, collId, key, type, attributes, orders) {
    try {
        await databases.createIndex(dbId, collId, key, type, attributes, orders);
        console.log(`   🔹 Index created: ${key}`);
    } catch (e) {
         if (e.code === 409) {
             // Index exists
         } else {
             console.warn(`   ⚠️ Error creating index ${key}:`, e.message);
         }
    }
}

main();
