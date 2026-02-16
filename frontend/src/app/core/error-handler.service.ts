import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private toastService = inject(ToastService);
  
  /**
   * Handle HTTP errors with user-friendly messages
   * @param error The HTTP error response
   * @param customMessage Optional custom message to display to user
   */
  handleHttpError(error: HttpErrorResponse, customMessage?: string): void {
    let errorMessage = customMessage || 'An error occurred. Please try again.';
    
    // Extract error details from backend response
    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Log to console for debugging
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      url: error.url,
      error: error.error
    });
    
    // Show user-friendly message
    this.showError(errorMessage);
  }
  
  /**
   * Handle general errors
   * @param message Error message
   * @param error Optional error object
   */
  handleError(message: string, error?: any): void {
    console.error(message, error);
    this.showError(message);
  }
  
  /**
   * Show error message to user
   */
  showError(message: string): void {
    this.toastService.error(message);
  }
  
  /**
   * Show success message to user
   */
  showSuccess(message: string): void {
    this.toastService.success(message);
  }
  
  /**
   * Show info message to user
   */
  showInfo(message: string): void {
    this.toastService.info(message);
  }
}
