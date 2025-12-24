import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const SOCIETIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID || 'societies';

if (!PROJECT_ID || !API_KEY || !DATABASE_ID) {
    console.error('❌ Error: Missing configuration in .env');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const sampleSocieties = [
    {
        name: "Tech Society",
        description: "Innovating the future, one line of code at a time. We organize hackathons, coding workshops, and tech talks.",
        logoUrl: "https://images.unsplash.com/photo-1531297420494-856f4af421a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        presidentName: "Alice Chen",
        vicePresidentName: "Bob Smith",
        convenerName: "Dr. A. Turing"
    },
    {
        name: "Music Club",
        description: "Bringing rhythm and harmony to campus. Join us for jam sessions, open mics, and concerts.",
        logoUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        presidentName: "Charlie Puth",
        vicePresidentName: "Dave Grohl",
        convenerName: "Prof. L. Beethoven"
    },
    {
        name: "Art & Design Club",
        description: "Unleashing creativity through visuals. We host art exhibitions, design workshops, and mural painting.",
        logoUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        presidentName: "Eva Green",
        vicePresidentName: "Frank Gehry",
        convenerName: "Ms. F. Kahlo"
    },
    {
        name: "Debating Society",
        description: "Fostering critical thinking and public speaking. We participate in parliamentary debates and MUNs.",
        logoUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        presidentName: "Grace Hopper",
        vicePresidentName: "Harry Potter",
        convenerName: "Mr. S. Holmes"
    }
];

async function seedSocieties() {
    console.log('🌱 Seeding Societies...');

    for (const society of sampleSocieties) {
        try {
            await databases.createDocument(
                DATABASE_ID,
                SOCIETIES_COLLECTION_ID,
                ID.unique(),
                society
            );
            console.log(`✅ Added: ${society.name}`);
        } catch (error) {
            console.error(`❌ Failed to add ${society.name}:`, error.message);
        }
    }
    console.log('🎉 Seeding Complete!');
}

seedSocieties();
