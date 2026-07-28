import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NoteRecord } from '../types/garden.types';

@Component({
  selector: 'app-note-hero-visual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-hero-visual.component.html',
  styleUrl: './note-hero-visual.component.scss',
})
export class NoteHeroVisualComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private static readonly imageExistsCache = new Map<string, boolean>();

  @Input({ required: true }) note!: NoteRecord;
  resolvedImageSrc?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['note']) return;
    void this.resolveImage();
  }

  private async resolveImage(): Promise<void> {
    const note = this.note;
    if (!note) {
      this.resolvedImageSrc = undefined;
      return;
    }

    const candidates = this.buildCandidates(note);
    for (const candidate of candidates) {
      const exists = await this.canLoad(candidate);
      if (exists) {
        this.resolvedImageSrc = candidate;
        this.cdr.detectChanges();
        return;
      }
    }

    this.resolvedImageSrc = undefined;
    this.cdr.detectChanges();
  }

  private buildCandidates(note: NoteRecord): string[] {
    const out: string[] = [];
    const add = (value?: string): void => {
      if (!value) return;
      if (!out.includes(value)) out.push(value);
    };

    const token = note.coverUpdatedAt ? Date.parse(note.coverUpdatedAt).toString() : Date.now().toString();
    if (note.coverImage) {
      add(`${note.coverImage}${note.coverImage.includes('?') ? '&' : '?'}v=${encodeURIComponent(token)}`);
      add(note.coverImage);
    }

    const slugBase = `/generated/${note.slug}`;
    add(`${slugBase}.png`);
    add(`${slugBase}.jpg`);
    add(`${slugBase}.jpeg`);
    add(`${slugBase}.webp`);

    return out;
  }

  private canLoad(src: string): Promise<boolean> {
    const cached = NoteHeroVisualComponent.imageExistsCache.get(src);
    if (cached != null) {
      return Promise.resolve(cached);
    }

    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        NoteHeroVisualComponent.imageExistsCache.set(src, true);
        resolve(true);
      };
      img.onerror = () => {
        NoteHeroVisualComponent.imageExistsCache.set(src, false);
        resolve(false);
      };
      img.src = src;
    });
  }
}
