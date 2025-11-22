
'use server';

import {
  getPhotoGuidance,
  type PhotoGuidanceInput,
} from '@/ai/flows/improve-prediction-accuracy';

export async function getPhotoTakingGuidanceAction(input: PhotoGuidanceInput) {
  try {
    const result = await getPhotoGuidance(input);
    return { success: true, guidance: result.guidance };
  } catch (error) {
    console.error('Error fetching photo guidance:', error);
    return {
      success: false,
      error: 'Failed to get guidance. Please check your connection and try again.',
    };
  }
}
