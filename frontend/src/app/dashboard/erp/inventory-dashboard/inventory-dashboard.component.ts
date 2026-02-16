import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErpService } from '../../../core/erp.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss'
})
export class InventoryDashboardComponent {
  private erpService = inject(ErpService);
  inventory = signal<any[]>([]);

  constructor() {
    this.loadInventory();
  }

  loadInventory() {
    this.erpService.getInventory().subscribe(data => {
      this.inventory.set(data);
    });
  }
}
