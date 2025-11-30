import { supabase } from './supabaseClient';

export async function handleAuthError(error: any) {
  // Check if this is a refresh token error
  if (error?.message?.includes('refresh') || 
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Refresh Token Not Found')) {
    
    console.log('Refresh token error detected, clearing session...');
    
    // Clear the invalid session
    await supabase.auth.signOut();
    
    // Clear any stored session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    return true; // Indicates error was handled
  }
  
  return false; // Error was not handled
}

export async function getSessionSafely() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      const handled = await handleAuthError(error);
      if (handled) {
        return { session: null, error: null };
      }
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    const handled = await handleAuthError(error);
    if (handled) {
      return { session: null, error: null };
    }
    return { session: null, error };
  }
}

export async function getUserSafely() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      const handled = await handleAuthError(error);
      if (handled) {
        return { user: null, error: null };
      }
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    const handled = await handleAuthError(error);
    if (handled) {
      return { user: null, error: null };
    }
    return { user: null, error };
  }
}