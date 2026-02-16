import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Authentication Guard
 * Protects routes from unauthenticated access
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    const isTenantAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN'; // SUPER_ADMIN also for testing
    const isSetupComplete = user?.tenant?.is_setup_complete;
    
    // Check if on onboarding page
    if (state.url.includes('/onboarding')) {
        // If setup is complete, redirect to dashboard
        if (isSetupComplete) {
            router.navigate(['/dashboard']);
            return false;
        }
        return true;
    }

    // If not on onboarding page, check if setup is required
    if (isTenantAdmin && !isSetupComplete && user?.tenant) {
        // Redirect to onboarding
        router.navigate(['/onboarding']);
        return false;
    }

    return true;
  }

  // Store the attempted URL for redirecting after login
  const redirectUrl = state.url;
  
  // Redirect to login page
  router.navigate(['/login'], { 
    queryParams: { returnUrl: redirectUrl }
  });
  
  return false;
};
