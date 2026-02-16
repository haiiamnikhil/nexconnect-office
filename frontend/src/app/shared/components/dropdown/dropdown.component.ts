import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, forwardRef, inject } from '@angular/core';
import { DROPDOWN_CONFIG, DropdownConfig, DEFAULT_DROPDOWN_CONFIG } from './dropdown.config';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';

/**
 * Custom Dropdown Component
 * Re-compiled for stability
 */
export interface DropdownOption {
  label: string;
  value: any;
  icon?: string;
  description?: string;
  badge?: string;
  badgeClass?: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ]
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string;
  @Input() searchPlaceholder: string;
  @Input() required: boolean = false;
  @Input() searchable: boolean;
  @Input() disabled: boolean = false;
  
  private _options: DropdownOption[] = [];

  // ... (set/get options) ...
  @Input() 
  set options(val: DropdownOption[]) {
    this._options = val || [];
    this.filteredOptions = this._options;
    this.updateSelectedOption();
  }
  get options(): DropdownOption[] {
    return this._options;
  }

  isOpen = false;
  searchTerm = '';
  filteredOptions: DropdownOption[] = [];
  selectedOption: DropdownOption | null = null;
  value: any = null;

  // ControlValueAccessor callbacks
  onChange: any = () => {};
  onTouched: any = () => {};

  private config = inject(DROPDOWN_CONFIG, { optional: true });

  constructor(private elementRef: ElementRef) {
    const defaults = { ...DEFAULT_DROPDOWN_CONFIG, ...(this.config || {}) };
    this.placeholder = defaults.placeholder!;
    this.searchable = defaults.searchable!;
    this.searchPlaceholder = defaults.searchPlaceholder!;
  }

  toggle() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchTerm = '';
      this.filteredOptions = this.options;
    } else {
      this.onTouched();
    }
  }

  close() {
    this.isOpen = false;
    this.onTouched();
  }

  select(option: DropdownOption) {
    this.value = option.value;
    this.selectedOption = option;
    this.onChange(this.value);
    this.close();
  }

  onSearch(term: string) {
    this.searchTerm = term;
    if (!term) {
      this.filteredOptions = this.options;
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredOptions = this.options.filter(opt => 
        opt.label.toLowerCase().includes(lowerTerm) || 
        (opt.description && opt.description.toLowerCase().includes(lowerTerm))
      );
    }
  }

  writeValue(obj: any): void {
    this.value = obj;
    this.updateSelectedOption();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  private updateSelectedOption() {
    if (this.value !== null && this.options && this.options.length > 0) {
      this.selectedOption = this.options.find(o => o.value === this.value) || null;
    } else {
      this.selectedOption = null;
    }
  }
  
  // Clean up if needed
  ngOnDestroy() {
    this.isOpen = false;
  }
}
