import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-text-rotate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-rotate.component.html',
  styleUrls: ['./text-rotate.component.css'],
  animations: [
    trigger('slideUp', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      state('out', style({ transform: 'translateY(-100%)', opacity: 0 })),
      transition('out => in', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('in => out', [
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class TextRotateComponent implements OnInit, OnDestroy {
  @Input() words: string[] = ['Business', 'HR', 'CRM', 'Projects', 'Teams'];
  @Input() interval: number = 3000;

  currentIndex: number = 0;
  private intervalId: any;
  
  get longestText(): string {
    return this.words.reduce((a, b) => a.length > b.length ? a : b, '');
  }

  ngOnInit() {
    this.startRotation();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startRotation() {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.words.length;
    }, this.interval);
  }
}
