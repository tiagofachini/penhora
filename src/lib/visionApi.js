import { supabase } from '@/lib/customSupabaseClient';

/**
 * Uploads an image to the analyze-image edge function using the custom domain.
 * This bypasses the default supabase.functions.invoke URL construction to ensure
 * we are hitting https://go.penhora.app.br/functions/v1/analyze-image
 * 
 * @param {File} file - The image file to analyze
 * @returns {Promise<Object>} - The analysis result { description, brand, characteristics }
 */
export async function analyzeImage(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('User not authenticated');

    // Use the custom domain explicitly
    const response = await fetch('https://go.penhora.app.br/functions/v1/analyze-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Vision API Error:', error);
    throw error;
  }
}