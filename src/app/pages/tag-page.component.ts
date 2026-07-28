import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContentService } from '../services/content.service';
import { NoteRecord } from '../types/garden.types';
import { getNoteContext, getNotesByTag } from '../utils/garden-utils';

@Component({
  selector: 'app-tag-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag-page.component.html',
  styleUrl: './tag-page.component.scss',
})
export class TagPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();

  tag = '';
  resolvedTag = '';
  matches: NoteRecord[] = [];

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap.subscribe(async (params) => {
        this.tag = decodeURIComponent(params.get('tag') ?? '');
        const index = await this.contentService.loadGardenIndex();
        this.matches = getNotesByTag(index.notes, this.tag);
        this.resolvedTag =
          this.matches.flatMap((note) => note.tags ?? []).find((value) => value.toLowerCase() === this.tag.toLowerCase()) ?? this.tag;
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  context(note: NoteRecord): string {
    return getNoteContext(note);
  }

  async openNote(slug: string): Promise<void> {
    await this.router.navigate(['/'], { queryParams: { note: slug } });
  }

  async backToGarden(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
