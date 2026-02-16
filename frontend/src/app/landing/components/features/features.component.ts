import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, ScrollAnimationDirective],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {}
