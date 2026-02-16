import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService, AssetAllocation } from '../../../../core/asset.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-assets.component.html',
  styleUrl: './my-assets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  private errorHandler = inject(ErrorHandlerService);

  // State management - using AssetAllocation which has assignment info
  myAssets = signal<AssetAllocation[]>([]);
  isLoading = signal(false);
  showReturnModal = signal(false);
  selectedAsset = signal<AssetAllocation | null>(null);
  returnRemarks = signal('');

  ngOnInit() {
    this.loadMyAssets();
  }

  loadMyAssets() {
    this.isLoading.set(true);
    // Use the dedicated getMyAssets() API which returns AssetAllocation[]
    this.assetService.getMyAssets().subscribe({
      next: (data) => {
        // Filter for active allocations only
        const activeAssets = data.filter(a => a.is_active);
        this.myAssets.set(activeAssets);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load your assets');
        this.isLoading.set(false);
      }
    });
  }

  openReturnRequest(asset: AssetAllocation) {
this.selectedAsset.set(asset);
    this.returnRemarks.set('');
    this.showReturnModal.set(true);
  }

  closeReturnModal() {
    this.showReturnModal.set(false);
    this.selectedAsset.set(null);
  }

  submitReturnRequest() {
    const asset = this.selectedAsset();
    if (!asset) return;

    // Create return request
    this.assetService.returnAsset(asset.id, {
      return_condition: 'Good',
      status: 'ACTIVE',
      remarks: this.returnRemarks()
    }).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Return request submitted successfully');
        this.loadMyAssets();
        this.closeReturnModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to submit return request')
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}
