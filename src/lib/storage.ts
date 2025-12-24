import { storage } from "./appwrite";
import { ID } from "appwrite";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || "event-posters";

export async function uploadFile(file: File): Promise<string> {
    try {
        const result = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );
        return result.$id;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export function getFilePreview(fileId: string): string {
    return storage.getFilePreview(BUCKET_ID, fileId).toString();
}

export function getFileView(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
}
