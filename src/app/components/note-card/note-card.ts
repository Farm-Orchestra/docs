import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NoteRecord } from '../../types/garden.types';
import { getNoteContext } from '../../utils/garden-utils';

@Component({
  selector: 'app-note-card',
  imports: [],
  templateUrl: './note-card.html',
  styleUrl: './note-card.scss',
})
export class NoteCard {

  @Input({ required: true }) note!: NoteRecord;
  @Output() open = new EventEmitter<void>();

  summary(note: NoteRecord): string {
    if (note.description?.trim()) return note.description;
    return getNoteContext(note, 220);
  }
}
