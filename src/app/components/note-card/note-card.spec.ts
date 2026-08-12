import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteCard } from './note-card';
import { createMockNote } from '../../utils/testing-mocks';
import { NoteRecord } from '@vault42/core';

const mockNote: NoteRecord = createMockNote({
    title: 'Signals'
});

describe('NoteCard', () => {
  let component: NoteCard;
  let fixture: ComponentFixture<NoteCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteCard);
    fixture.componentRef.setInput('note', mockNote);
    
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
