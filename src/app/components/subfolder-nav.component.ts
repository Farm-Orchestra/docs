import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubfolderTreeItem } from '../types/garden.types';

@Component({
  selector: 'app-subfolder-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subfolder-nav.component.html',
  styleUrl: './subfolder-nav.component.scss',
})
export class SubfolderNavComponent {
  @Input() items: SubfolderTreeItem[] = [];
  @Input() currentSubfolder?: string;
  @Output() select = new EventEmitter<string | undefined>();
}
