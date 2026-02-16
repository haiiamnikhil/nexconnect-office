import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssetService, Asset, AssetAllocation } from '../../../../core/asset.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asset-detail.component.html',
  styleUrl: './asset-detail.component.scss'
})
export class AssetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assetService = inject(AssetService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  asset = signal<Asset | null>(null);
  allocations = signal<AssetAllocation[]>([]);
  isLoading = signal(false);
  activeTab = signal<'details' | 'history' | 'maintenance'>('details');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAssetDetails(+id);
    }
  }

  loadAssetDetails(id: number) {
    this.isLoading.set(true);
    // Note: You'll need to add a getAssetById method to AssetService
    // For now, we'll load all assets and filter
    this.assetService.getAssets().subscribe({
      next: (assets) => {
        const foundAsset = assets.find(a => a.id === id);
        if (foundAsset) {
          this.asset.set(foundAsset);
        } else {
          this.errorHandler.showError('Asset not found');
          this.router.navigate(['/dashboard/assets/inventory']);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load asset details');
        this.isLoading.set(false);
      }
    });
  }

  setActiveTab(tab: 'details' | 'history' | 'maintenance') {
    this.activeTab.set(tab);
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'AVAILABLE': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'ASSIGNED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'IN_REPAIR': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'SCRAPPED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'LOST': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return classes[status] || classes['AVAILABLE'];
  }

  goBack() {
    this.router.navigate(['/dashboard/assets/inventory']);
  }
}
