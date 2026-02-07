import { Client, Databases, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const WATCHED_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCHED_COLLECTION_ID;

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie, userId) => {
  if (!userId) return; // only track for signed-in users
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
    Query.equal('user_id', userId),
  ])

  // 2. If it does, update the count
  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,
   })
  // 3. If it doesn't, create a new document with the search term and count as 1
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    user_id: userId,
   })
  }
 } catch (error) {
  console.error(error);
 }
}

export const getTrendingMovies = async (userId) => {
 try {
  const queries = [
    Query.limit(5),
    Query.orderDesc("count")
  ];
  if (userId) {
    queries.push(Query.equal('user_id', userId));
  }
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, queries)

  return result.documents;
 } catch (error) {
  console.error(error);
  return [];
 }
}

// ── Watched list (per-user, stored in Appwrite) ──

/**
 * Fetch all watched items for a given user.
 * Returns an array of documents: { $id, user_id, media_type, media_id }
 */
export const getWatchedItems = async (userId) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHED_COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.limit(500),
    ]);
    return result.documents;
  } catch (error) {
    console.error('Error fetching watched items:', error);
    return [];
  }
};

/**
 * Add a media item to the user's watched list.
 * Returns the created document.
 */
export const addWatchedItem = async (userId, mediaType, mediaId) => {
  try {
    const doc = await database.createDocument(DATABASE_ID, WATCHED_COLLECTION_ID, ID.unique(), {
      user_id: userId,
      media_type: mediaType,
      media_id: String(mediaId),
    });
    return doc;
  } catch (error) {
    console.error('Error adding watched item:', error);
    return null;
  }
};

/**
 * Remove a media item from the user's watched list.
 * Finds the document by user_id + media_type + media_id, then deletes it.
 */
export const removeWatchedItem = async (userId, mediaType, mediaId) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHED_COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.equal('media_type', mediaType),
      Query.equal('media_id', String(mediaId)),
    ]);
    if (result.documents.length > 0) {
      await database.deleteDocument(DATABASE_ID, WATCHED_COLLECTION_ID, result.documents[0].$id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing watched item:', error);
    return false;
  }
};