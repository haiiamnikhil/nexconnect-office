import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruitmentService, JobApplication } from '../../../../core/recruitment.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-candidate-pipeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-pipeline.component.html',
  styleUrl: './candidate-pipeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidatePipelineComponent implements OnInit {
  private recruitmentService = inject(RecruitmentService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  applications = signal<JobApplication[]>([]);
  isLoading = signal(false);
  
  stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];

  // Kanban board data - group applications by stage
  kanbanData = computed(() => {
    const apps = this.applications();
    const result: Record<string, JobApplication[]> = {};
    
    this.stages.forEach(stage => {
      result[stage] = apps.filter(app => app.current_stage === stage);
    });
    
    return result;
  });

  // Stage statistics
  stageStats = computed(() => {
    const data = this.kanbanData();
    return this.stages.map(stage => ({
      stage,
      count: data[stage]?.length || 0
    }));
  });

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading.set(true);
    this.recruitmentService.getApplications().subscribe({
      next: (data) => {
        this.applications.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load applications');
        this.isLoading.set(false);
      }
    });
  }

  moveStage(application: JobApplication, newStage: string) {
    if (application.current_stage === newStage) {
      this.errorHandler.showInfo('Application is already in this stage');
      return;
    }

    this.recruitmentService.updateStage(application.id, newStage).subscribe({
      next: () => {
        this.errorHandler.showSuccess(`Moved to ${newStage}`);
        // Optimistic update
        this.applications.update(apps =>
          apps.map(app =>
            app.id === application.id ? { ...app, current_stage: newStage as any } : app
          )
        );
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to update stage')
    });
  }

  getStageColor(stage: string): string {
    const map: Record<string, string> = {
      'APPLIED': 'bg-gray-100',
      'SCREENING': 'bg-blue-100',
      'INTERVIEW': 'bg-yellow-100',
      'OFFERED': 'bg-green-100',
      'HIRED': 'bg-green-200',
      'REJECTED': 'bg-red-100'
    };
    return map[stage] || 'bg-gray-100';
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'fas fa-star text-yellow-400' : 'far fa-star text-gray-300');
    }
    return stars;
  }
}
