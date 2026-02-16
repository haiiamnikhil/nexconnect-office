import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssetService, Asset } from '../../../../core/asset.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-asset-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asset-dashboard.component.html',
  styleUrl: './asset-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDashboardComponent implements OnInit {
  private assetService = inject(AssetService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  assets = signal<Asset[]>([]);
  isLoading = signal(false);

  // Computed statistics
  totalAssets = computed(() => this.assets().length);

  assignedAssets = computed(() =>
    this.assets().filter(a => a.current_holder !== null && a.current_holder !== undefined).length
  );

  availableAssets = computed(() =>
    this.assets().filter(a => (a.current_holder === null || a.current_holder === undefined) && a.status === 'AVAILABLE').length
  );

  maintenanceAssets = computed(() =>
    this.assets().filter(a => a.status === 'IN_REPAIR').length
  );

  scrappedAssets = computed(() =>
    this.assets().filter(a => a.status === 'SCRAPPED' || a.status === 'LOST').length
  );

  // Asset breakdown by category
  assetsByCategory = computed(() => {
    const assets = this.assets();
    const categoryMap: Record<string, number> = {};
    
    assets.forEach(asset => {
      const category = asset.category_name || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    
    return Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
  });


  ngOnInit() {
    this.loadAssets();
  }

  loadAssets() {
    this.isLoading.set(true);
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load assets');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'ACTIVE': 'badge-success',
      'MAINTENANCE': 'badge-warning',
      'RETIRED': 'badge-error'
    };
    return map[status] || 'badge-pending';
  }

  getUtilizationPercentage(): number {
    const total = this.totalAssets();
    if (total === 0) return 0;
    const assigned = this.assignedAssets();
    return Math.round((assigned / total) * 100);
  }

  getUtilizationColor(): string {
    const utilization = this.getUtilizationPercentage();
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 50) return 'text-blue-600';
    return 'text-yellow-600';
  }

  refreshData() {
    this.loadAssets();
  }
}
