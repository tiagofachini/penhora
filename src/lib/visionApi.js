import { supabase } from '@/lib/customSupabaseClient';

export async function analyzeImage(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('User not authenticated');

    const response = await fetch('https://hsvxxhvfmgzopkfyhuac.supabase.co/functions/v1/analyze-image', {
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