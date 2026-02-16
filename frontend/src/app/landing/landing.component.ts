import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../core/services/seo.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturesComponent } from './components/features/features.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { FooterComponent } from './components/footer/footer.component';
import { FaqComponent } from './components/faq/faq.component';
import { WhyChooseComponent } from './components/why-choose/why-choose.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    HeroComponent,
    FeaturesComponent,
    TestimonialsComponent,
    FooterComponent,
    FaqComponent,
    WhyChooseComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  constructor(private seo: SeoService) {
    this.seo.updateMetaTags({
      title: 'Opus - Enterprise Suite | HR, CRM & Project Management',
      description: 'The all-in-one Enterprise Suite for HR, CRM, and Operations. Streamline workflows, boost productivity, and scale faster with Opus.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop'
    });
  }
}
