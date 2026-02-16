import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssetCategory {
  id: number;
  name: string;
  description: string;
}

export interface Asset {
  id: number;
  name: string;
  category: number;
  category_name: string;
  serial_number: string;
  asset_id: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_REPAIR' | 'SCRAPPED' | 'LOST';
  location_name: string;
  current_holder?: string;
}

export interface AssetAllocation {
  id: number;
  asset: number;
  asset_name: string;
  asset_serial: string;
  employee_name: string;
  assigned_date: string;
  return_date?: string;
  is_active: boolean;
  remarks: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/assets`;

  // Categories
  getCategories(): Observable<AssetCategory[]> {
    return this.http.get<AssetCategory[]>(`${this.apiUrl}/categories/`);
  }

  // Inventory
  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.apiUrl}/inventory/`);
  }

  getAssetById(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/inventory/${id}/`);
  }

  createAsset(data: any): Observable<Asset> {
    return this.http.post<Asset>(`${this.apiUrl}/inventory/`, data);
  }

  assignAsset(id: number, data: { employee_id: number, remarks: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventory/${id}/assign/`, data);
  }

  returnAsset(id: number, data: { return_condition: string, status: string, remarks: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventory/${id}/return_asset/`, data);
  }

  // My Assets
  getMyAssets(): Observable<AssetAllocation[]> {
    return this.http.get<AssetAllocation[]>(`${this.apiUrl}/my-assets/`);
  }
}

