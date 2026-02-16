import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  /**
   * Show a success toast
   * @param message Message to display
   * @param duration Duration in ms (default 3000)
   */
  success(message: string, duration: number = 3000) {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   * @param message Message to display
   * @param duration Duration in ms (default 5000)
   */
  error(message: string, duration: number = 5000) {
    this.show(message, 'error', duration);
  }

  /**
   * Show an info toast
   * @param message Message to display
   * @param duration Duration in ms (default 3000)
   */
  info(message: string, duration: number = 3000) {
    this.show(message, 'info', duration);
  }

  /**
   * Show a warning toast
   * @param message Message to display
   * @param duration Duration in ms (default 4000)
   */
  warning(message: string, duration: number = 4000) {
    this.show(message, 'warning', duration);
  }

  /**
   * Internal method to add toast to the signal
   */
  private show(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number) {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Remove a toast by ID
   * @param id Toast ID
   */
  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
