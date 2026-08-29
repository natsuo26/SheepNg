import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonDemo } from './button-demo';

describe('ButtonDemo', () => {
  let component: ButtonDemo;
  let fixture: ComponentFixture<ButtonDemo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonDemo],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonDemo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a button for every variant and tone combination', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="matrix"] sheep-button',
    );

    expect(buttons.length).toBe(25);
  });

  it('owns no theme control — the app shell does', () => {
    expect(
      fixture.nativeElement.querySelector('sheep-theme-switcher'),
    ).toBeNull();
  });
});
