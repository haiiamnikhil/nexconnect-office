import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErpService } from '../../../core/erp.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent {
  private erpService = inject(ErpService);
  projects = signal<any[]>([]);

  constructor() {
    this.loadProjects();
  }

  loadProjects() {
    this.erpService.getProjects().subscribe(data => {
      this.projects.set(data);
    });
  }
}
