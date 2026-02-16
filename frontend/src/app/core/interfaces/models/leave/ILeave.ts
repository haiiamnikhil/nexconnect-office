// Leave request core interface
export interface ILeaveRequestCore {
  id?: number;
  employee: number;
  leave_type: number;
  start_date: string;
  end_date: string;
  reason?: string;
}

// Leave request metadata
export interface ILeaveRequestMetadata {
  employee_name?: string;
  leave_type_name?: string;
  days_requested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}

// Leave request approval info
export interface ILeaveRequestApproval {
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

// Full leave request model
export interface ILeaveRequest extends ILeaveRequestCore, ILeaveRequestMetadata, ILeaveRequestApproval {
  created_at?: string;
  updated_at?: string;
}

// Leave balance interface
export interface ILeaveBalance {
  id?: number;
  employee: number;
  leave_type: number;
  leave_type_name?: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}

// Leave filter interface
export interface ILeaveFilter {
  employee?: number;
  leave_type?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}
