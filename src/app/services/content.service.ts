import { Injectable } from '@angular/core';
import { GardenContentSource, GardenIndex } from '@vault42/core';

@Injectable()
export class JulzLabContentSource extends GardenContentSource {
  private cache: GardenIndex | null = null;

  override async loadGardenIndex(): Promise<GardenIndex> {
    if (this.cache) {
      return this.cache;
    }

    const emptyIndex: GardenIndex = {
      generatedAt: new Date(0).toISOString(),
      notebooks: [],
      notes: [],
    };

    this.cache =
      (await this.fetchIndex('/content/index.json', 12000)) ?? emptyIndex;

    return this.cache;
  }

  private async fetchIndex(
    url: string,
    timeoutMs: number,
  ): Promise<GardenIndex | null> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      timeoutMs,
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const parsed = (await response.json()) as GardenIndex;

      if (
        !parsed ||
        !Array.isArray(parsed.notes) ||
        !Array.isArray(parsed.notebooks)
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  clearCache(): void {
    this.cache = null;
  }

}
