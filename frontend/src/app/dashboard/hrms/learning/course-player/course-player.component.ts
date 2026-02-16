import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-player.component.html',
})
export class CoursePlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  courseId: number | null = null;
  course: any = null;
  activeLesson: any = null;
  
  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourseDetails();
  }

  loadCourseDetails() {
    // Mock data
    this.course = {
      id: this.courseId,
      title: 'Compliance Basics',
      modules: [
        {
          id: 1,
          title: 'Introduction',
          lessons: [
            { id: 101, title: 'Welcome to the Course', type: 'VIDEO', duration: 5, completed: true },
            { id: 102, title: 'Why Compliance Matters', type: 'ARTICLE', duration: 10, completed: false }
          ]
        },
        {
          id: 2,
          title: 'Core Policies',
          lessons: [
            { id: 201, title: 'Code of Conduct', type: 'VIDEO', duration: 15, completed: false }
          ]
        }
      ]
    };
    
    // Set first active lesson
    if (this.course.modules.length > 0 && this.course.modules[0].lessons.length > 0) {
      this.activeLesson = this.course.modules[0].lessons[0];
    }
  }

  selectLesson(lesson: any) {
    this.activeLesson = lesson;
  }
  
  markComplete() {
    if (this.activeLesson) {
        this.activeLesson.completed = true;
        // Call API to mark complete
    }
  }
}
