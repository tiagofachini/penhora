import { supabase } from '@/lib/customSupabaseClient';

/**
 * Creates an admin user via a Supabase Edge Function.
 * WARNING: This function should only be called from a secure, admin-only interface.
 * Exposing the service_role_key on the client-side is a major security risk.
 *
 * @param {string} email - The new admin's email.
 * @param {string} password - The new admin's password.
 * @param {string} service_role_key - The Supabase service role key.
 * @returns {Promise<object>} - The result of the function invocation.
 */
export async function callCreateAdminUser(email, password, service_role_key) {
  try {
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: JSON.stringify({ email, password, service_role_key }),
    });

    if (error) {
      console.error('Error calling create-admin-user function:', error);
      throw new Error(`Function invocation failed: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    throw err;
  }
}