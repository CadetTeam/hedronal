// Utility functions for uploading images via backend API
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://hedronal-production.up.railway.app/api';

// Base64 decode helper for React Native (atob polyfill)
function decodeBase64(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  base64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output;
}

/**
 * Uploads an image via backend API to Supabase storage
 * @param localUri - Local file URI from ImagePicker
 * @param bucket - Storage bucket name ('avatars' or 'banners')
 * @param fileName - Optional custom file name
 * @param clerkToken - Clerk authentication token
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  localUri: string,
  bucket: 'avatars' | 'banners',
  fileName?: string,
  clerkToken?: string
): Promise<string> {
  try {
    console.log(`[uploadImageToSupabase] Starting upload to bucket: ${bucket}`);
    console.log(`[uploadImageToSupabase] Local URI: ${localUri}`);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64' as any,
    });

    // Determine content type from file extension
    const fileExtension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = fileExtension === 'png' ? 'image/png' : 
                       fileExtension === 'webp' ? 'image/webp' : 
                       'image/jpeg';

    // Upload via backend API
    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({
        imageData: base64,
        bucket,
        fileName,
        contentType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[uploadImageToSupabase] Upload error:`, error);
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    console.log(`[uploadImageToSupabase] Upload successful:`, result.url);

    return result.url;
  } catch (error: any) {
    console.error(`[uploadImageToSupabase] Error:`, error);
    throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Uploads multiple images (avatar and/or banner) via backend API
 * @param avatarUri - Optional local URI for avatar image
 * @param bannerUri - Optional local URI for banner image
 * @param clerkToken - Clerk authentication token
 * @returns Object with avatar_url and banner_url (null if not provided)
 */
export async function uploadEntityImages(
  avatarUri?: string,
  bannerUri?: string,
  clerkToken?: string
): Promise<{ avatar_url: string | null; banner_url: string | null }> {
  const result: { avatar_url: string | null; banner_url: string | null } = {
    avatar_url: null,
    banner_url: null,
  };

  try {
    // Upload avatar if provided
    if (avatarUri) {
      console.log('[uploadEntityImages] Uploading avatar...');
      result.avatar_url = await uploadImageToSupabase(
        avatarUri,
        'avatars',
        `entity-avatar-${Date.now()}.jpg`,
        clerkToken
      );
    }

    // Upload banner if provided
    if (bannerUri) {
      console.log('[uploadEntityImages] Uploading banner...');
      result.banner_url = await uploadImageToSupabase(
        bannerUri,
        'banners',
        `entity-banner-${Date.now()}.jpg`,
        clerkToken
      );
    }

    console.log('[uploadEntityImages] All images uploaded successfully');
    return result;
  } catch (error: any) {
    console.error('[uploadEntityImages] Error uploading images:', error);
    throw error;
  }
}

/**
 * Uploads profile images (avatar and/or banner) via backend API
 * @param avatarUri - Optional local URI for avatar image
 * @param bannerUri - Optional local URI for banner image
 * @param clerkToken - Clerk authentication token
 * @returns Object with avatar_url and banner_url (null if not provided)
 */
export async function uploadProfileImages(
  avatarUri?: string,
  bannerUri?: string,
  clerkToken?: string
): Promise<{ avatar_url: string | null; banner_url: string | null }> {
  const result: { avatar_url: string | null; banner_url: string | null } = {
    avatar_url: null,
    banner_url: null,
  };

  try {
    // Upload avatar if provided
    if (avatarUri) {
      console.log('[uploadProfileImages] Uploading avatar...');
      result.avatar_url = await uploadImageToSupabase(
        avatarUri,
        'avatars',
        `profile-avatar-${Date.now()}.jpg`,
        clerkToken
      );
    }

    // Upload banner if provided
    if (bannerUri) {
      console.log('[uploadProfileImages] Uploading banner...');
      result.banner_url = await uploadImageToSupabase(
        bannerUri,
        'banners',
        `profile-banner-${Date.now()}.jpg`,
        clerkToken
      );
    }

    console.log('[uploadProfileImages] All images uploaded successfully');
    return result;
  } catch (error: any) {
    console.error('[uploadProfileImages] Error uploading images:', error);
    throw error;
  }
}

