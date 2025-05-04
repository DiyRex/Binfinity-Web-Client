// src/components/auth/KeycloakProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { keycloakService } from '@/services/keycloak/keycloak';
import { useRouter, usePathname } from 'next/navigation';

interface KeycloakProviderProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

export default function KeycloakProvider({
  children,
  publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
}: KeycloakProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const initKeycloak = async () => {
      try {
        // Check if we're on a public path
        const isPublicPath = publicPaths.some((path) =>
          pathname?.startsWith(path)
        );

        if (isPublicPath) {
          // For public paths, we don't need to initialize Keycloak
          if (isMounted) {
            setIsInitialized(true);
            setIsLoading(false);
          }
          return;
        }

        // Initialize Keycloak
        const authenticated = await keycloakService.initialize();

        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);

          if (!authenticated) {
            // This should trigger a redirect to the Keycloak login page
            keycloakService.login();
          }
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initKeycloak();

    return () => {
      isMounted = false;
    };
  }, [pathname, publicPaths, router]);

  // Show loading state while Keycloak is initializing
  if (isLoading) {
    return (
      <div className='flex h-screen w-screen items-center justify-center'>
        <div className='border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent'></div>
      </div>
    );
  }

  // Render children when initialized
  return <>{children}</>;
}
