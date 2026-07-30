import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NoteRecord } from '../../types/garden.types';

@Component({
  selector: 'app-note-row-item',
  imports: [],
  templateUrl: './note-row-item.html',
  styleUrl: './note-row-item.scss',
})
export class NoteRowItem {

   @Input({ required: true }) note!: NoteRecord;
   @Output() open = new EventEmitter<void>();
}
