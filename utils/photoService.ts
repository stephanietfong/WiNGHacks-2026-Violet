/**
 * Photo Service - Utilities for managing user photos
 */

const API_BASE_URL = "http://10.136.197.71:3000";

interface DeletePhotoResponse {
  success: boolean;
  message: string;
}

/**
 * Delete a photo from a user's profile
 * @param userId - The user's ID
 * @param photoIndex - The index of the photo in the photos array
 * @returns Response with success status and message
 */
export const deletePhoto = async (
  userId: string,
  photoIndex: number,
): Promise<DeletePhotoResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/photos/${photoIndex}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete photo",
      };
    }

    return {
      success: true,
      message: data.message || "Photo deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Network error while deleting photo",
    };
  }
};

/**
 * Get all photos for a user
 * @param userId - The user's ID
 * @returns Array of photos with their metadata
 */
export const getUserPhotos = async (
  userId: string,
): Promise<Array<{
  url: string;
  publicId: string;
  isVerificationPhoto: boolean;
}> | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/photos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};
