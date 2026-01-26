'use server'

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import firebaseApp from '@/lib/firebaseAdmin';

/**
 * Helper function to get the current user's UID from session cookie
 * @returns User ID or null if not authenticated
 */
export async function getSessionUid(): Promise<string | null> {
  try {
    const auth = getAuth(firebaseApp);
    const sessionCookie = (await cookies()).get('__session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

// "use server"

// import { getFirestore } from 'firebase-admin/firestore';
// import { getAuth } from 'firebase-admin/auth';
// import app from '@/lib/firebaseAdmin';
// import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';
// import { cookies } from 'next/headers';
// import { getStorage, getDownloadURL } from 'firebase-admin/storage';

// // Define types based on the CharacterCreationPage component
// type AttributeCategory = 'hair' | 'bodyType' | 'ethnicity';

// interface Character {
//   id: number | string;
//   name: string;
//   image: string;
//   isActive: boolean;
//   gender?: string;
//   age?: string;
//   description?: string;
//   hair?: string[];
//   bodyType?: string[];
//   ethnicity?: string[];
//   createdAt?: Date;
//   userId?: string;
// }

// interface CharacterFormData {
//   name: string;
//   gender: 'FEMALE' | 'MALE' | 'OTHER';
//   age: string;
//   hair: string[];
//   bodyType: string[];
//   ethnicity: string[];
//   description: string;
//   imageUrl?: string | null;
// }

// /**
//  * Server action to create a new character
//  * @param formData Character form data
//  * @param imageUrl URL of the uploaded character image
//  * @returns The created character or an error
//  */
// export async function createCharacter(formData: CharacterFormData): Promise<{ success: boolean; message: string; characterId?: string }> {
//   try {
//     // Get the current authenticated user
//     const auth = getAuth(app);
//     const sessionCookie = (await cookies()).get('session')?.value;
    
//     if (!sessionCookie) {
//       redirect("/auth");
//     }
    
//     // Verify the session cookie
//     const decodedClaims = await auth.verifySessionCookie(sessionCookie);
//     const userId = decodedClaims.uid;
    
//     if (!userId) {
//       return { success: false, message: 'User not authenticated' };
//     }
    
//     // Validate required fields
//     if (!formData.name) {
//       return { success: false, message: 'Character name is required' };
//     }
    
//     if (!formData.imageUrl) {
//       return { success: false, message: 'Character image is required' };
//     }
    
//     // Create character object
//     const character: Character = {
//       name: formData.name,
//       gender: formData.gender,
//       age: formData.age,
//       description: formData.description,
//       hair: formData.hair,
//       bodyType: formData.bodyType,
//       ethnicity: formData.ethnicity,
//       image: formData.imageUrl,
//       isActive: true,
//       createdAt: new Date(),
//       userId: userId
//     };
    
//     // Save to Firestore
//     const db = getFirestore();
//     const characterRef = await db.collection('characters').add(character);
    
//     // Revalidate the characters page to show the new character
//     revalidatePath('/character');
    
//     return { 
//       success: true, 
//       message: 'Character created successfully', 
//       characterId: characterRef.id 
//     };
//   } catch (error) {
//     console.error('Error creating character:', error);
//     return { 
//       success: false, 
//       message: error instanceof Error ? error.message : 'Failed to create character' 
//     };
//   }
// }

// /**
//  * Server action to upload a character image to storage
//  * @param file The image file to upload
//  * @returns The URL of the uploaded image
//  */
// export async function uploadCharacterImage(file: File): Promise<{ success: boolean; url?: string; message?: string }> {
//   try {
//     // Get the current authenticated user
//     const auth = getAuth();
//     const sessionCookie = cookies().get('session')?.value;
    
//     if (!sessionCookie) {
//       return { success: false, message: 'Authentication required' };
//     }
    
//     // Verify the session cookie
//     const decodedClaims = await auth.verifySessionCookie(sessionCookie);
//     const userId = decodedClaims.uid;
    
//     if (!userId) {
//       return { success: false, message: 'User not authenticated' };
//     }
    
//     // Validate file
//     if (!file) {
//       return { success: false, message: 'No file provided' };
//     }
    
//     // Check file type
//     if (!file.type.startsWith('image/')) {
//       return { success: false, message: 'File must be an image' };
//     }
    
//     // Upload to Firebase Storage
//     const storage = getStorage(app);
//     const fileRef = ref(storage, `characters/${userId}/${Date.now()}-${file.name}`);
    
//     // Convert File to Buffer for upload
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);
    
//     // Upload the file
//     await uploadBytes(fileRef, buffer, {
//       contentType: file.type
//     });
    
//     // Get the download URL
//     const downloadUrl = await getDownloadURL(fileRef);
    
//     return { success: true, url: downloadUrl };
//   } catch (error) {
//     console.error('Error uploading image:', error);
//     return { 
//       success: false, 
//       message: error instanceof Error ? error.message : 'Failed to upload image' 
//     };
//   }
// }

// /**
//  * Server action to delete a character
//  * @param characterId The ID of the character to delete
//  * @returns Success status and message
//  */
// export async function deleteCharacter(characterId: string): Promise<{ success: boolean; message: string }> {
//   try {
//     // Get the current authenticated user
//     const auth = getAuth();
//     const sessionCookie = cookies().get('session')?.value;
    
//     if (!sessionCookie) {
//       return { success: false, message: 'Authentication required' };
//     }
    
//     // Verify the session cookie
//     const decodedClaims = await auth.verifySessionCookie(sessionCookie);
//     const userId = decodedClaims.uid;
    
//     if (!userId) {
//       return { success: false, message: 'User not authenticated' };
//     }
    
//     // Get the character
//     const db = getFirestore();
//     const characterDoc = await db.collection('characters').doc(characterId).get();
    
//     if (!characterDoc.exists) {
//       return { success: false, message: 'Character not found' };
//     }
    
//     const characterData = characterDoc.data() as Character;
    
//     // Check if the user owns this character
//     if (characterData.userId !== userId) {
//       return { success: false, message: 'You do not have permission to delete this character' };
//     }
    
//     // Delete the character
//     await db.collection('characters').doc(characterId).delete();
    
//     // Revalidate the characters page
//     revalidatePath('/character');
    
//     return { success: true, message: 'Character deleted successfully' };
//   } catch (error) {
//     console.error('Error deleting character:', error);
//     return { 
//       success: false, 
//       message: error instanceof Error ? error.message : 'Failed to delete character' 
//     };
//   }
// }

// /**
//  * Server action to get all characters for a user
//  * @returns List of characters
//  */
// export async function getUserCharacters(): Promise<{ success: boolean; characters?: Character[]; message?: string }> {
//   try {
//     // Get the current authenticated user
//     const auth = getAuth();
//     const sessionCookie = cookies().get('session')?.value;
    
//     if (!sessionCookie) {
//       return { success: false, message: 'Authentication required' };
//     }
    
//     // Verify the session cookie
//     const decodedClaims = await auth.verifySessionCookie(sessionCookie);
//     const userId = decodedClaims.uid;
    
//     if (!userId) {
//       return { success: false, message: 'User not authenticated' };
//     }
    
//     // Get characters from Firestore
//     const db = getFirestore();
//     const charactersSnapshot = await db.collection('characters')
//       .where('userId', '==', userId)
//       .orderBy('createdAt', 'desc')
//       .get();
    
//     const characters: Character[] = [];
    
//     charactersSnapshot.forEach(doc => {
//       const data = doc.data() as Character;
//       characters.push({
//         ...data,
//         id: doc.id
//       });
//     });
    
//     return { success: true, characters };
//   } catch (error) {
//     console.error('Error getting characters:', error);
//     return { 
//       success: false, 
//       message: error instanceof Error ? error.message : 'Failed to get characters' 
//     };
//   }
// }