import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLogo } from './main-logo/main-logo';
import { BRAND_NAME } from '../utils/branding.constants';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, MainLogo],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
})
export class TopNavComponent {
  readonly logoName = BRAND_NAME;
  
  @Input() notebooks: string[] = [];
  @Input() current?: string;
  @Output() navigate = new EventEmitter<{ notebook?: string }>();
}
