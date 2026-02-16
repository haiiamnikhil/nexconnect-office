// Basic employee information (ISP - client only needs basic info)
export interface IEmployeeBasic {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Employee contact information
export interface IEmployeeContact {
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
}

// Employee work information
export interface IEmployeeWork {
  designation?: string;
  department?: {
    id: number;
    name: string;
  };
  date_of_joining?: string;
  employment_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  manager?: number;
  shift?: number;
}

// Full employee model (composition)
export interface IEmployee extends IEmployeeBasic, IEmployeeContact, IEmployeeWork {
  user?: number;
  tenant?: number;
  is_active?: boolean;
}

// Employee filter interface
export interface IEmployeeFilter {
  search?: string;
  department?: number;
  designation?: string;
  is_active?: boolean;
  employment_type?: string;
}
