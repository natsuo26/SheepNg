import { TestBed } from '@angular/core/testing';
import { SheepThemeService } from './sheep-theme.service';

describe('SheepThemeService', () => {
  let service: SheepThemeService;

  beforeEach(() => {
    localStorage.removeItem('sheep-ng:theme');
    document.documentElement.removeAttribute('data-sheep-theme');

    TestBed.configureTestingModule({});
    service = TestBed.inject(SheepThemeService);
    TestBed.tick();
  });

  afterEach(() => {
    localStorage.removeItem('sheep-ng:theme');
    document.documentElement.removeAttribute('data-sheep-theme');
  });

  it('follows the OS by default and pins no attribute', () => {
    expect(service.preference()).toBe('system');
    expect(document.documentElement.hasAttribute('data-sheep-theme')).toBe(
      false,
    );
  });

  it('pins the attribute when a theme is chosen', () => {
    service.set('dark');
    TestBed.tick();

    expect(document.documentElement.getAttribute('data-sheep-theme')).toBe(
      'dark',
    );
    expect(service.resolved()).toBe('dark');
  });

  it('remembers the choice', () => {
    service.set('light');

    expect(localStorage.getItem('sheep-ng:theme')).toBe('light');
  });

  it('drops the attribute again on system', () => {
    service.set('dark');
    TestBed.tick();
    service.set('system');
    TestBed.tick();

    expect(document.documentElement.hasAttribute('data-sheep-theme')).toBe(
      false,
    );
  });
});
