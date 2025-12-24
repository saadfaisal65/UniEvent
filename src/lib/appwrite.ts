import { Client, Account, Databases, Storage } from 'appwrite';

// Validate environment variables
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!ENDPOINT || !PROJECT_ID) {
    console.error('Missing Appwrite configuration. Please set environment variables:');
    console.error('NEXT_PUBLIC_APPWRITE_ENDPOINT:', ENDPOINT ? '✓' : '✗ MISSING');
    console.error('NEXT_PUBLIC_APPWRITE_PROJECT_ID:', PROJECT_ID ? '✓' : '✗ MISSING');
}

export const client = new Client();

client
    .setEndpoint(ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID || 'demo-project');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
