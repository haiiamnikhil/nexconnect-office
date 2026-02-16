import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, OrganizationChartModule, CardModule, ButtonModule],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.scss'
})
export class OrgChartComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = `${environment.apiUrl}/hrms/org-hierarchy/tree/`;
    
    data = signal<TreeNode[]>([]);

    ngOnInit() {
        this.loadOrgTree();
    }

    loadOrgTree() {
        this.http.get<TreeNode[]>(this.apiUrl).subscribe({
            next: (res) => {
                const data = Array.isArray(res) ? res : [];
                this.data.set(data);
            },
            error: (err) => console.error('Failed to load org tree', err)
        });
    }

    goBack() {
        this.router.navigate(['/dashboard/org-structure']);
    }
}
