import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NoteRecord } from '../../types/garden.types';
import { getNoteContext } from '../../utils/garden-utils';

const DESCRIPTION_CHAR_MAX = 70;

@Component({
  selector: 'app-note-row-item',
  imports: [],
  templateUrl: './note-row-item.html',
  styleUrl: './note-row-item.scss',
})
export class NoteRowItem {

  @Input({ required: true }) note!: NoteRecord;
  @Output() open = new EventEmitter<void>();

  trimmedDescription: string = "Default Description";

  ngOnInit() {
    this.trimmedDescription = this.trimDescription(this.note);
  }

  trimDescription(note: NoteRecord): string {
      return getNoteContext(note, DESCRIPTION_CHAR_MAX);
  }
}
