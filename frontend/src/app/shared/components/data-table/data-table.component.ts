import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Added FormsModule
import { ColumnDef, RowAction } from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: ColumnDef[] = [];
  @Input() actions: RowAction[] = [];
  @Input() pageSize: number = 10;
  @Input() loading: boolean = false;
  @Input() showRefresh: boolean = false;
  
  @Output() actionClicked = new EventEmitter<{ action: string, row: any }>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<void>();

  // Helpers for template
  isFunction(val: any): boolean { return typeof val === 'function'; }
  isString(val: any): boolean { return typeof val === 'string'; }

  // Pagination
  currentPage = 1;
  totalPages = 1;
  pagedData: any[] = [];
  
  // Sorting
  sortField: string = '';
  sortDir: 'asc' | 'desc' = 'asc';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.calculatePagination();
      this.refreshView();
    }
  }

  // --- Sorting ---
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.refreshView();
  }

  // --- Pagination ---
  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
    }
    return pages; // Simple approach, can be optimized for many pages
  }

  calculatePagination() {
    const totalItems = Array.isArray(this.data) ? this.data.length : 0;
    this.totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.refreshView();
  }

  refreshView() {
    let processed = Array.isArray(this.data) ? [...this.data] : [];

    // 1. Sort
    if (this.sortField) {
      processed.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 2. Paginate
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedData = processed.slice(start, end);
  }

  onAction(action: string, row: any, event: Event) {
    event.stopPropagation();
    this.actionClicked.emit({ action, row });
  }

  // Helper
  getValue(row: any, col: ColumnDef): any {
    if (typeof col.format === 'function') {
      return col.format(row);
    }
    
    // Handle nested keys (e.g. 'candidate.first_name')
    const value = col.field.split('.').reduce((obj, key) => obj?.[key], row);
    return value;
  }

  getBadgeClass(col: ColumnDef, value: string): string {
    if (!col.badgeColors) return 'bg-gray-100 text-gray-800';
    return col.badgeColors[value] || 'bg-gray-100 text-gray-800';
  }

  getDateFormat(col: ColumnDef): string {
    if (typeof col.format === 'string') return col.format;
    return 'mediumDate';
  }
}
