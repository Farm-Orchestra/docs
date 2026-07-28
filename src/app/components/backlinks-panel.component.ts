import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BacklinkEntry } from '../types/garden.types';

@Component({
  selector: 'app-backlinks-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backlinks-panel.component.html',
  styleUrl: './backlinks-panel.component.scss',
})
export class BacklinksPanelComponent {
  @Input() backlinks: BacklinkEntry[] = [];
  @Output() openNote = new EventEmitter<string>();
}
