import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent {
  productGroups = [
    {
      id: 'hrms',
      title: 'Human Resource Management',
      subtitle: 'Empower your workforce from hire to retire.',
      description: 'A complete suite to manage your most valuable asset—your people. Streamline recruitment, onboarding, payroll, and performance reviews in one unified platform.',
      color: 'primary',
      features: [
        'Core HR & Employee Database',
        'Smart Recruitment (ATS)',
        'Automated Payroll & Tax',
        'Performance & Goals',
        'Learning Management (LMS)',
        'Time & Attendance'
      ],
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 'crm',
      title: 'Customer Relationship Management',
      subtitle: 'Build lasting relationships and drive sales.',
      description: 'Track leads, manage client interactions, and close deals faster. Our CRM gives you a 360-degree view of your customer journey.',
      color: 'blue',
      features: [
        'Sales Pipeline Management',
        'Lead Scoring & Nurturing',
        'Client Profiles & History',
        'Activity Tracking',
        'Email Integration',
        'Revenue Forecasting'
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 'erp',
      title: 'Enterprise Resource Planning',
      subtitle: 'Optimize operations and resource allocation.',
      description: 'Break down silos between departments. Manage projects, inventory, assets, and documents with precision and real-time visibility.',
      color: 'indigo',
      features: [
        'Project Management',
        'Inventory Control',
        'Asset Tracking',
        'Document Management (DMS)',
        'Procurement',
        'Financial Reporting'
      ],
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 'analytics',
      title: 'Intelligence & Analytics',
      subtitle: 'Data-driven decisions at your fingertips.',
      description: 'Turn data into actionable insights. Customizable dashboards and AI-driven reports help you spot trends and make informed strategic moves.',
      color: 'purple',
      features: [
        'Real-time Dashboards',
        'Custom Report Builder',
        'AI Predictive Analytics',
        'Workforce Metrics',
        'Financial KPIs',
        'Export & Sharing'
      ],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
    }
  ];
}
