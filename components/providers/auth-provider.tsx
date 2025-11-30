'use client';

import { useEffect, useState } from 'react';
import { autoAuthenticate, refreshAuth } from '@/lib/pocketbase/auth';

/**
 * Authentication Provider for Kiosk Mode
 * Automatically authenticates using environment variables on mount
 * and refreshes the token every 10 minutes
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        // Auto-authenticate on mount
        async function init() {
            try {
                const success = await autoAuthenticate();
                if (!success) {
                    setAuthError('Failed to authenticate. Check environment variables.');
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setAuthError('Authentication failed');
            } finally {
                setIsAuthenticating(false);
            }
        }

        init();

        // Refresh auth token every 10 minutes
        const refreshInterval = setInterval(() => {
            refreshAuth();
        }, 10 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, []);

    // Show loading state while authenticating
    if (isAuthenticating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verbindung wird hergestellt...</p>
                </div>
            </div>
        );
    }

    // Show error if authentication failed
    if (authError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md p-8">
                    <div className="text-destructive text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Verbindungsfehler</h2>
                    <p className="text-muted-foreground mb-4">{authError}</p>
                    <p className="text-sm text-muted-foreground">
                        Bitte überprüfen Sie die Konfiguration und versuchen Sie es erneut.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
