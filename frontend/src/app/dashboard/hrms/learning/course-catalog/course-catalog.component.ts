import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './course-catalog.component.html',
  styleUrl: './course-catalog.component.scss'
})
export class CourseCatalogComponent implements OnInit {
  courses = signal<any[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('All');
  loading = signal(true);

  categoryOptions = computed(() => 
    this.categories().map(c => ({
      label: c,
      value: c,
      icon: c === 'All' ? 'fas fa-th-large' : 'fas fa-book'
    }))
  );

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCourses();
    this.loadCategories();
  }

  loadCourses() {
    // Mock data for now, replace with API call later
    // this.http.get('/api/hrms/learning/courses/').subscribe(...)
    // Mock data removed.
    this.courses.set([]);
    this.loading.set(false);
  }

  loadCategories() {
    this.categories.set(['All', 'Compliance', 'Soft Skills', 'Technical']);
  }
}
