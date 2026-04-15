export const logActivity = async (supabase, action, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to fetch IP address — 1.5s timeout to avoid blocking logout
    let ip_address = null;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(t);
      const data = await res.json();
      ip_address = data.ip;
    } catch (e) { /* non-fatal */ }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      owner_id: user.id,
      action,
      ip_address,
      details: {
        ...details,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};