import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  faqs = signal([
    {
      question: 'What modules are included in NexConnect?',
      answer: 'NexConnect is a comprehensive Enterprise Suite that includes HR Management (HRMS), Customer Relationship Management (CRM), Project Management, Inventory Control, and an integrated Support Helpdesk. All modules are unified in a single platform.',
      isOpen: false
    },
    {
      question: 'Is NexConnect suitable for small businesses?',
      answer: 'Yes! NexConnect is designed to scale. Whether you are a small startup with 10 employees or a large enterprise with thousands, our modular architecture adapts to your needs.',
      isOpen: false
    },
    {
      question: 'How secure is my data with NexConnect?',
      answer: 'We prioritize security. NexConnect uses enterprise-grade encryption for data at rest and in transit. We are GDPR compliant and perform regular security audits to ensure your data remains safe.',
      isOpen: false
    },
    {
      question: 'Can I import data from my existing systems?',
      answer: 'Absolutely. We offer robust data import tools and APIs to help you migrate employee records, customer data, and inventory lists from legacy systems seamlessly.',
      isOpen: false
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes, we offer a 14-day full-featured free trial. No credit card is required to start, so you can explore all the powerful features of NexConnect risk-free.',
      isOpen: false
    }
  ]);

  toggle(index: number) {
    this.faqs.update(items =>
      items.map((item, i) =>
        i === index ? { ...item, isOpen: !item.isOpen } : { ...item, isOpen: false }
      )
    );
  }
}
