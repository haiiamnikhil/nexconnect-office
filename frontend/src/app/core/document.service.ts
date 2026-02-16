import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentCategory {
  id: number;
  name: string;
}

export interface CompanyDocument {
  id: number;
  title: string;
  description: string;
  document_file: string;
  category: number;
  category_name: string;
  visibility: 'ALL' | 'ADMIN' | 'DEPT';
  uploaded_by_name: string;
  uploaded_at: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/documents`;

  getCategories(): Observable<DocumentCategory[]> {
    return this.http.get<DocumentCategory[]>(`${this.apiUrl}/categories/`);
  }

  getDocuments(search?: string): Observable<CompanyDocument[]> {
    const params: any = {};
    if (search) params.search = search;
    return this.http.get<CompanyDocument[]>(`${this.apiUrl}/files/`, { params });
  }

  uploadDocument(data: FormData): Observable<CompanyDocument> {
    return this.http.post<CompanyDocument>(`${this.apiUrl}/files/`, data);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${id}/`);
  }

  createCategory(name: string): Observable<DocumentCategory> {
    return this.http.post<DocumentCategory>(`${this.apiUrl}/categories/`, { name });
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${id}/download/`, { responseType: 'blob' });
  }
}
