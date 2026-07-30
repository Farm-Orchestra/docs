import { Component, Input } from '@angular/core';
import { NoteRecord } from '../../types/garden.types';

@Component({
  selector: 'app-note-row-item',
  imports: [],
  templateUrl: './note-row-item.html',
  styleUrl: './note-row-item.scss',
})
export class NoteRowItem {

   @Input({ required: true }) note!: NoteRecord;
}
