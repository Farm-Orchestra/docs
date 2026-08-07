import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-main-logo',
  imports: [],
  templateUrl: './main-logo.html',
  styleUrl: './main-logo.scss',
})
export class MainLogo {
  @Input({ required: true }) name!: string;
  @Input() clickable = true;
  @Input() variant: 'default' | 'footer' = 'default';
  @Output() navigate = new EventEmitter<{ notebook?: string }>();
}
