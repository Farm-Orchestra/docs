import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteRowItem } from './note-row-item';
import { NoteRecord } from '@vault42/core';
import { createMockNote } from '../../utils/testing-mocks';

const mockNote: NoteRecord = createMockNote({
    title: 'Signals'
});

describe('NoteRowItem', () => {
  let component: NoteRowItem;
  let fixture: ComponentFixture<NoteRowItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteRowItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteRowItem);

    fixture.componentRef.setInput('note', mockNote);

    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    expect(fixture.nativeElement.textContent)
      .toContain(mockNote.title);
  });

  it('should render the notebook category', () => {
    expect(fixture.nativeElement.textContent)
      .toContain(mockNote.notebook);
  });

});


