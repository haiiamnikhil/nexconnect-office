import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, ScrollAnimationDirective],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent {}
