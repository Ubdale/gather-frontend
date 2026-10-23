import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
describe('Gather shell', () => {
  it('creates the router shell', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toBe('Gather');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
