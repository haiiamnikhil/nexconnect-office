import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendancePolicy } from '../../../../core/attendance.service';
import { ToastService } from '../../../../core/toast.service';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-list.component.html',
  styleUrl: './policy-list.component.scss'
})
export class PolicyListComponent implements OnInit {
  policies: AttendancePolicy[] = [];
  showModal = false;
  isEditing = false;
  
  currentPolicy: AttendancePolicy = this.getEmptyPolicy();

  constructor(
      private attendanceService: AttendanceService,
      private toastService: ToastService
  ) {}

  ngOnInit() {
      this.loadPolicies();
  }

  loadPolicies() {
      this.attendanceService.getPolicies().subscribe({
          next: (data: any) => {
              this.policies = Array.isArray(data) ? data : (data.results || []);
          },
          error: () => this.toastService.error('Failed to load policies')
      });
  }

  getEmptyPolicy(): AttendancePolicy {
      return {
          name: '',
          work_hours_per_day: 8,
          grace_period_minutes: 15,
          half_day_hours: 4,
          allow_overtime: true,
          allow_reentry: false,
          is_default: false,
          is_active: true
      };
  }

  openModal() {
      this.isEditing = false;
      this.currentPolicy = this.getEmptyPolicy();
      this.showModal = true;
  }

  editPolicy(policy: AttendancePolicy) {
      this.isEditing = true;
      this.currentPolicy = { ...policy };
      this.showModal = true;
  }

  closeModal() {
      this.showModal = false;
  }

  savePolicy() {
      if (!this.currentPolicy.name) {
          this.toastService.error('Policy name is required');
          return;
      }

      const request = this.isEditing && this.currentPolicy.id
          ? this.attendanceService.updatePolicy(this.currentPolicy.id, this.currentPolicy)
          : this.attendanceService.createPolicy(this.currentPolicy);

      request.subscribe({
          next: () => {
              this.toastService.success(`Policy ${this.isEditing ? 'updated' : 'created'} successfully`);
              this.loadPolicies();
              this.closeModal();
          },
          error: (err) => this.toastService.error(err.error?.detail || 'Failed to save policy')
      });
  }

  deletePolicy(policy: AttendancePolicy) {
      if (!confirm(`Are you sure you want to delete policy "${policy.name}"?`)) return;
      
      if (policy.id) {
          this.attendanceService.deletePolicy(policy.id).subscribe({
              next: () => {
                  this.toastService.success('Policy deleted');
                  this.loadPolicies();
              },
              error: () => this.toastService.error('Failed to delete policy')
          });
      }
  }
}
