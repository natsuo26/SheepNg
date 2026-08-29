import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepListItemComponent } from './sheep-list-item.component';

describe('SheepListItemComponent', () => {
  let fixture: ComponentFixture<SheepListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheepListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepListItemComponent);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('is a listitem on a non-interactive host', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('listitem');
  });

  it('is not current until selected', () => {
    expect(fixture.nativeElement.hasAttribute('aria-current')).toBe(false);
  });
});
