import { Injectable } from '@angular/core';
import { GardenIndex } from '../types/garden.types';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private cache: GardenIndex | null = null;
  private coverIndexCache: Record<string, { coverImage?: string; coverUpdatedAt?: string; coverHidden?: boolean }> | null = null;

  async loadGardenIndex(): Promise<GardenIndex> {
    if (this.cache) return this.cache;

    const emptyIndex: GardenIndex = { generatedAt: new Date(0).toISOString(), notebooks: [], notes: [] };
    const data = (await this.fetchIndex('/content/index.json', 12000)) ?? emptyIndex;
    const coverIndex = await this.loadCoverIndex();
    const hydrated = this.enrichWithCovers(data, coverIndex);

    this.cache = hydrated;
    return hydrated;
  }

  private async fetchIndex(url: string, timeoutMs: number): Promise<GardenIndex | null> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) return null;
      const parsed = (await response.json()) as GardenIndex;
      if (!parsed || !Array.isArray(parsed.notes) || !Array.isArray(parsed.notebooks)) return null;
      return parsed;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async loadCoverIndex(): Promise<Record<string, { coverImage?: string; coverUpdatedAt?: string; coverHidden?: boolean }>> {
    if (this.coverIndexCache) return this.coverIndexCache;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('/content/cover-index.json', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) {
        this.coverIndexCache = {};
        return this.coverIndexCache;
      }
      const parsed = (await response.json()) as Record<string, { coverImage?: string; coverUpdatedAt?: string; coverHidden?: boolean }>;
      this.coverIndexCache = parsed ?? {};
      return this.coverIndexCache;
    } catch {
      this.coverIndexCache = {};
      return this.coverIndexCache;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private enrichWithCovers(
    index: GardenIndex,
    coverIndex: Record<string, { coverImage?: string; coverUpdatedAt?: string; coverHidden?: boolean }>,
  ): GardenIndex {
    const byBasename = new Map<string, Array<{ key: string; coverImage?: string; coverUpdatedAt?: string; coverHidden?: boolean }>>();

    for (const [key, value] of Object.entries(coverIndex)) {
      const base = key.split('/').filter(Boolean).pop();
      if (!base) continue;
      const bucket = byBasename.get(base) ?? [];
      bucket.push({ key, ...value });
      byBasename.set(base, bucket);
    }

    return {
      ...index,
      notes: index.notes.map((note) => {
        if (note.coverImage) return note;

        const direct = coverIndex[note.slug];
        if (direct?.coverImage && !direct.coverHidden) {
          return { ...note, coverImage: direct.coverImage, coverUpdatedAt: direct.coverUpdatedAt };
        }

        const base = note.slug.split('/').filter(Boolean).pop();
        if (!base) return note;

        const candidates = byBasename.get(base) ?? [];
        const notebookScoped = candidates.find((entry) => entry.key.startsWith(`${note.notebook.toLowerCase()}/`));
        const winner = notebookScoped ?? candidates[0];
        if (!winner?.coverImage || winner.coverHidden) return note;

        return { ...note, coverImage: winner.coverImage, coverUpdatedAt: winner.coverUpdatedAt };
      }),
    };
  }
}
