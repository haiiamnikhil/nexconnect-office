import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ErrorHandlerService } from '../error-handler.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);

  const requiredPermission = route.data['permission'] as string;

  if (!requiredPermission) {
    return true; // No permission required
  }

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  // Permission denied
  errorHandler.showError('You do not have permission to access this page');
  router.navigate(['/dashboard']);
  return false;
};
