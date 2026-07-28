import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('should create the app', () => {
    const fixture = TestBed.configureTestingModule({ imports: [App] }).createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
