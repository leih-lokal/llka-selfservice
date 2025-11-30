import pb from './client';

/**
 * Auto-authenticate using environment variables
 * For kiosk mode - credentials stored in .env.local
 */
export async function autoAuthenticate() {
    // Check if already authenticated
    if (pb.authStore.isValid) {
        console.log('Already authenticated');
        return true;
    }

    const username = process.env.NEXT_PUBLIC_POCKETBASE_USER;
    const password = process.env.NEXT_PUBLIC_POCKETBASE_PASSWORD;

    if (!username || !password) {
        console.error('Missing NEXT_PUBLIC_POCKETBASE_USER or NEXT_PUBLIC_POCKETBASE_PASSWORD');
        return false;
    }

    try {
        await pb.collection('_superusers').authWithPassword(username, password);
        console.log('Auto-authentication successful');
        return true;
    } catch (error) {
        console.error('Auto-authentication failed:', error);
        return false;
    }
}

/**
 * Refresh authentication token
 * Call periodically to keep session alive
 */
export async function refreshAuth() {
    if (!pb.authStore.isValid) {
        // Try to auto-authenticate if not valid
        return await autoAuthenticate();
    }

    try {
        await pb.collection('_superusers').authRefresh();
        console.log('Auth token refreshed');
        return true;
    } catch (error) {
        console.error('Auth refresh failed:', error);
        pb.authStore.clear();
        // Try to re-authenticate
        return await autoAuthenticate();
    }
}

/**
 * Check if authenticated
 */
export function isAuthenticated() {
    return pb.authStore.isValid;
}
