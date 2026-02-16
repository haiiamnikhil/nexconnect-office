import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  privateviewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private permission = '';
  private isVisible = false;

  constructor() {
    effect(() => {
      // Re-run check when user signals change
      const user = this.authService.currentUser();
      this.updateView();
    });
  }

  @Input() set appHasPermission(val: string) {
    this.permission = val;
    this.updateView();
  }

  private updateView() {
    const hasAccess = this.authService.hasPermission(this.permission);

    if (hasAccess && !this.isVisible) {
      this.privateviewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasAccess && this.isVisible) {
      this.privateviewContainer.clear();
      this.isVisible = false;
    }
  }
}
