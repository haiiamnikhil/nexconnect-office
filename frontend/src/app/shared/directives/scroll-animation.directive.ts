import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appScrollAnimation]',
  standalone: true
})
export class ScrollAnimationDirective implements AfterViewInit, OnDestroy {
  @Input('appScrollAnimation') animationClass = 'animate-fade-in-up';
  @Input() threshold = 0.1;
  @Input() delay = '0ms';

  private observer: IntersectionObserver | undefined;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.setupObserver();
    
    // Initial state: hide and prepare for transition
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transition-delay', this.delay);
  }

  private setupObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const animationClass = this.animationClass || 'animate-fade-in-up';
            this.renderer.addClass(this.el.nativeElement, animationClass);
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            
            if (this.observer) {
              this.observer.unobserve(entry.target);
            }
          }
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: this.threshold
      });

      if (this.observer) {
        this.observer.observe(this.el.nativeElement);
      }
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
