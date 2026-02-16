import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../../core/ai.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent {
  private aiService = inject(AiService);

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([{ text: 'Hi! I am your HR Assistant. How can I help you today?', sender: 'bot', time: new Date() }]);
  userMessage = '';
  isLoading = signal(false);

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const msg = this.userMessage;
    this.messages.update(msgs => [...msgs, { text: msg, sender: 'user', time: new Date() }]);
    this.userMessage = '';
    this.isLoading.set(true);

    this.aiService.ask(msg).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, { text: res.answer, sender: 'bot', time: new Date() }]);
        this.isLoading.set(false);
      },
      error: () => {
         this.messages.update(msgs => [...msgs, { text: 'Sorry, I encountered an error.', sender: 'bot', time: new Date() }]);
         this.isLoading.set(false);
      }
    });
  }
}
