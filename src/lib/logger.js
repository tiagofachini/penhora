export const logActivity = async (supabase, action, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to fetch IP address
    let ip_address = null;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ip_address = data.ip;
    } catch (e) {
      console.warn('Could not fetch IP for log');
    }

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