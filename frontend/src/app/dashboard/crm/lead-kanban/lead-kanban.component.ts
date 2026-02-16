import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CrmService } from '../../../core/crm.service';

@Component({
  selector: 'app-lead-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './lead-kanban.component.html',
  styleUrl: './lead-kanban.component.scss'
})
export class LeadKanbanComponent {
  private crmService = inject(CrmService);
  
  // Stages mapped to backend choices
  stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  
  // Data structure for the board: { 'NEW': [lead1, lead2], ... }
  board = signal<Record<string, any[]>>({});

  constructor() {
    this.initialBoard();
    this.loadLeads();
  }

  initialBoard() {
      const emptyBoard: Record<string, any[]> = {};
      this.stages.forEach(stage => emptyBoard[stage] = []);
      this.board.set(emptyBoard);
  }

  loadLeads() {
    this.crmService.getLeads().subscribe(leads => {
      const newBoard: Record<string, any[]> = {};
      this.stages.forEach(stage => newBoard[stage] = []);
      
      leads.forEach(lead => {
        if (newBoard[lead.stage]) {
            newBoard[lead.stage].push(lead);
        }
      });
      this.board.set(newBoard);
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const lead = event.container.data[event.currentIndex];
      const newStage = event.container.id; // We'll set the HTML id to the stage name
      
      this.updateLeadStage(lead.id, newStage);
    }
  }

  updateLeadStage(leadId: number, stage: string) {
      this.crmService.updateLead(leadId, { stage }).subscribe();
  }
}
