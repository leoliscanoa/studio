'use server';

/**
 * @fileOverview This file defines a Genkit flow to provide guidance on improving image capture for better AI model predictions.
 *
 * - `getPhotoGuidance`: A function that generates guidance for improving photo capture techniques.
 * - `PhotoGuidanceInput`: The input type for the `getPhotoGuidance` function.
 * - `PhotoGuidanceOutput`: The return type for the `getPhotoGuidance` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PhotoGuidanceInputSchema = z.object({
  userQuery: z
    .string()
    .describe("The user's question or request for guidance on taking better photos."),
});
export type PhotoGuidanceInput = z.infer<typeof PhotoGuidanceInputSchema>;

const PhotoGuidanceOutputSchema = z.object({
  guidance: z
    .string()
    .describe('Helpful tips and instructions for improving photo capture techniques for better AI predictions.'),
});
export type PhotoGuidanceOutput = z.infer<typeof PhotoGuidanceOutputSchema>;

export async function getPhotoGuidance(input: PhotoGuidanceInput): Promise<PhotoGuidanceOutput> {
  return photoGuidanceFlow(input);
}

const photoGuidancePrompt = ai.definePrompt({
  name: 'photoGuidancePrompt',
  input: {schema: PhotoGuidanceInputSchema},
  output: {schema: PhotoGuidanceOutputSchema},
  prompt: `You are an expert in providing guidance on how to capture better photos for AI models to make more accurate predictions.

  The user will ask a question about how to improve their image capture technique. Provide clear, concise, and actionable instructions.

  User Query: {{{userQuery}}}
  `,
});

const photoGuidanceFlow = ai.defineFlow(
  {
    name: 'photoGuidanceFlow',
    inputSchema: PhotoGuidanceInputSchema,
    outputSchema: PhotoGuidanceOutputSchema,
  },
  async input => {
    const {output} = await photoGuidancePrompt(input);
    return output!;
  }
);
