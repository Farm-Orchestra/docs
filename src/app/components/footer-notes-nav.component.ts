import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MainLogo } from './main-logo/main-logo';
import { NoteRecord } from '@vault42/core';
import { BRAND_NAME } from '../utils/branding.constants';

type FooterGroup = {
  key: string;
  notebook: string;
  subfolder?: string;
  notes: NoteRecord[];
};

@Component({
  selector: 'app-footer-notes-nav',
  standalone: true,
  imports: [CommonModule, MainLogo],
  templateUrl: './footer-notes-nav.component.html',
  styleUrl: './footer-notes-nav.component.scss',
})
export class FooterNotesNavComponent implements OnChanges {
  readonly logoName = BRAND_NAME;
  
  @Input() notes: NoteRecord[] = [];
  @Output() openNote = new EventEmitter<string>();
  @Output() navigate = new EventEmitter<{ notebook?: string }>();

  columns: FooterGroup[][] = [[], [], [], []];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['notes']) return;

    const groupsByKey = new Map<string, FooterGroup>();

    for (const note of this.notes) {
      const parts = note.relativePath.split('/').filter(Boolean);
      const subfolder = parts.length >= 3 ? parts[1] : undefined;
      const key = `${note.notebook.toLowerCase()}::${(subfolder ?? '').toLowerCase()}`;

      if (!groupsByKey.has(key)) {
        groupsByKey.set(key, {
          key,
          notebook: note.notebook,
          subfolder,
          notes: [],
        });
      }

      groupsByKey.get(key)?.notes.push(note);
    }

    const groups = Array.from(groupsByKey.values())
      .map((group) => ({
        ...group,
        notes: [...group.notes].sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => {
        const notebookCmp = a.notebook.localeCompare(b.notebook);
        if (notebookCmp !== 0) return notebookCmp;
        return (a.subfolder ?? '').localeCompare(b.subfolder ?? '');
      });

    const next: FooterGroup[][] = [[], [], [], []];
    const weights = [0, 0, 0, 0];

    for (const group of groups) {
      let target = 0;
      for (let i = 1; i < weights.length; i += 1) {
        if (weights[i] < weights[target]) target = i;
      }

      next[target].push(group);
      weights[target] += group.notes.length + 3;
    }

    this.columns = next;
  }
}
