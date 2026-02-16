export interface ColumnDef {
  field: string;
  header: string;
  type?: 'text' | 'date' | 'badge' | 'number' | 'currency';
  format?: string | ((row: any) => any); // Date string or transformer function
  classes?: string;
  badgeColors?: Record<string, string>; // Map value to class
}

export interface RowAction {
  label: string;
  icon?: string;
  action: string; // Event name
  classes?: string;
}
