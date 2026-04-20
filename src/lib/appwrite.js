import { Client, Account, Databases, Query, ID, Permission, Role } from "appwrite";

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject("69e62b1e002805ef3412");

export const account = new Account(client);
export const databases = new Databases(client);
export const DB_ID = "gmailpay";
export { Query, ID, Permission, Role };

// Helper: list documents with optional queries
export async function listDocs(collection, queries = []) {
  const r = await databases.listDocuments(DB_ID, collection, queries);
  return r.documents;
}

// Helper: create document
export async function createDoc(collection, data, perms) {
  return databases.createDocument(DB_ID, collection, ID.unique(), data, perms);
}

// Helper: update document
export async function updateDoc(collection, id, data) {
  return databases.updateDocument(DB_ID, collection, id, data);
}

// Helper: delete document
export async function deleteDoc(collection, id) {
  return databases.deleteDocument(DB_ID, collection, id);
}
