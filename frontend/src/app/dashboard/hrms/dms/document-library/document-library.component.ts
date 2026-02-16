import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, CompanyDocument, DocumentCategory } from '../../../../core/document.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './document-library.component.html',
  styleUrl: './document-library.component.scss'
})
export class DocumentLibraryComponent implements OnInit {
  private documentService = inject(DocumentService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  documents = signal<CompanyDocument[]>([]);
  categories = signal<DocumentCategory[]>([]);
  isLoading = signal(false);
  showUploadModal = signal(false);
  
  // Filter state (plain properties for ngModel binding)
  selectedCategory = 'ALL';
  searchQuery = '';

  // Dropdown Options
  categoryFilterOptions = computed(() => [
    { label: 'All Categories', value: 'ALL', icon: 'fas fa-layer-group' },
    ...this.categories().map(c => ({
      label: c.name,
      value: c.name,
      icon: 'fas fa-folder'
    }))
  ]);

  uploadCategoryOptions = computed(() => 
    this.categories().map(c => ({
      label: c.name,
      value: c.id, // Upload likely needs ID
      icon: 'fas fa-folder-open'
    }))
  );

  visibilityOptions = computed(() => [
    { label: 'Public (All)', value: 'ALL', icon: 'fas fa-globe', description: 'Visible to everyone' },
    { label: 'Department Only', value: 'DEPARTMENT', icon: 'fas fa-building', description: 'Visible to department members' },
    { label: 'Private (Me)', value: 'PRIVATE', icon: 'fas fa-lock', description: 'Only visible to you' }
  ]);

  
  // Upload form
  uploadForm = signal({
    title: '',
    description: '',
    category: '',
    visibility: 'ALL',
    file: null as File | null
  });

  ngOnInit() {
    this.loadDocuments();
    this.loadCategories();
  }

  loadDocuments() {
    this.isLoading.set(true);
    this.documentService.getDocuments(this.searchQuery).subscribe({
      next: (data: any) => {
        const docs = Array.isArray(data) ? data : (data.results || []);
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load documents');
        this.documents.set([]); // Ensure it's always an array
        this.isLoading.set(false);
      }
    });
  }

  loadCategories() {
    this.documentService.getCategories().subscribe({
      next: (data: any) => {
        const categories = Array.isArray(data) ? data : (data.results || []);
        this.categories.set(categories);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load categories');
        this.categories.set([]); // Ensure it's always an array
      }
    });
  }

  get filteredDocs() {
    let docs = this.documents();
    const category = this.selectedCategory;
    
    if (category !== 'ALL') {
      docs = docs.filter(d => d.category_name === category);
    }
    return docs;
  }

  updateFormTitle(title: string) {
    this.uploadForm.update(f => ({ ...f, title }));
  }

  updateFormCategory(category: string) {
    this.uploadForm.update(f => ({ ...f, category }));
  }

  updateFormDescription(description: string) {
    this.uploadForm.update(f => ({ ...f, description }));
  }

  updateFormVisibility(visibility: string) {
    this.uploadForm.update(f => ({ ...f, visibility }));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadForm.update(form => ({ ...form, file }));
    }
  }

  openUploadModal() {
    this.resetForm();
    this.showUploadModal.set(true);
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
    this.resetForm();
  }

  submitUpload() {
    const form = this.uploadForm();
    
    if (!form.file || !form.title) {
      this.errorHandler.showError('Please provide document title and select a file');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('visibility', form.visibility);
    if (form.category) formData.append('category', form.category);
    formData.append('document_file', form.file);

    this.isLoading.set(true);
    this.documentService.uploadDocument(formData).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Document uploaded successfully');
        this.closeUploadModal();
        this.loadDocuments();
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to upload document');
        this.isLoading.set(false);
      }
    });
  }

  downloadDocument(doc: CompanyDocument) {
    // Integrate with backend download endpoint
    if (doc.id) {
      this.documentService.downloadDocument(doc.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.title || 'document';
          a.click();
          window.URL.revokeObjectURL(url);
          this.errorHandler.showSuccess('Document downloaded successfully');
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to download document')
      });
    }
  }

  deleteDocument(id: number) {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      this.documentService.deleteDocument(id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Document deleted successfully');
          this.loadDocuments();
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to delete document')
      });
    }
  }

  resetForm() {
    this.uploadForm.set({
      title: '',
      description: '',
      category: '',
      visibility: 'ALL',
      file: null
    });
  }
}
