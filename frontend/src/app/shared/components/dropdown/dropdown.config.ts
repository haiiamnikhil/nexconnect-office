import { InjectionToken } from '@angular/core';

export interface DropdownConfig {
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean; // Future enhancement
  searchPlaceholder?: string;
  overlayClass?: string; 
}

export const DROPDOWN_CONFIG = new InjectionToken<DropdownConfig>('DROPDOWN_CONFIG');

export const DEFAULT_DROPDOWN_CONFIG: DropdownConfig = {
  placeholder: 'Select an option',
  searchable: true,
  searchPlaceholder: 'Search...',
  overlayClass: '' 
};
