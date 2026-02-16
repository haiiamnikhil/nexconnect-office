import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { FooterComponent } from '../components/footer/footer.component';
import { ScrollAnimationDirective } from '../../shared/directives/scroll-animation.directive';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    FooterComponent, 
    ScrollAnimationDirective,
    FormsModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  constructor(private seo: SeoService) {
    this.seo.updateMetaTags({
      title: 'Contact Opus - Get in Touch',
      description: 'Have questions? Contact the Opus team for sales, support, or general inquiries.',
      image: 'https://images.unsplash.com/photo-1423666639041-f14d70fa4c4d?auto=format&fit=crop&q=80&w=2000'
    });
  }

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  onSubmit() {
    console.log('Form submitted:', this.formData);
    // Add toast or alert here
    alert('Message sent! We will get back to you shortly.');
    this.formData = { name: '', email: '', subject: '', message: '' };
  }
}
