import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { viewChild } from '@angular/core';
import { SHEEP_LIST } from './sheep-list.imports';
import { SHEEP_LIST_ROW_HEIGHT } from './sheep-list.constants';

@Component({
  imports: [SHEEP_LIST],
  template: `
    <sheep-list [size]="'sm'" divided>
      <div sheepListSubheader>Folders</div>
      <sheep-list-item>
        <div sheepListItemTitle>Reports</div>
        <div sheepListItemLine>Yesterday</div>
        <span sheepListItemMeta>12</span>
      </sheep-list-item>
      <a sheep-list-item href="/inbox" selected>
        <div sheepListItemTitle>Inbox</div>
      </a>
      <button sheep-list-item type="button">
        <div sheepListItemTitle>Archive</div>
      </button>
    </sheep-list>
  `,
})
class HostComponent {}

describe('SheepListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    host = fixture.nativeElement;
  });

  it('renders as a list', () => {
    const list = host.querySelector('sheep-list');

    expect(list).toBeTruthy();
    expect(list?.getAttribute('role')).toBe('list');
  });

  it('reflects size and divided on the list', () => {
    const list = host.querySelector('sheep-list');

    expect(list?.classList.contains('sheep-list--sm')).toBe(true);
    expect(list?.classList.contains('sheep-list--divided')).toBe(true);
  });

  it('marks the element form as a listitem', () => {
    const item = host.querySelector('sheep-list-item');

    expect(item?.getAttribute('role')).toBe('listitem');
  });

  it('leaves native semantics alone on anchor and button rows', () => {
    const link = host.querySelector('a[sheep-list-item]');
    const button = host.querySelector('button[sheep-list-item]');

    expect(link?.hasAttribute('role')).toBe(false);
    expect(button?.hasAttribute('role')).toBe(false);
  });

  it('exposes the selected row to assistive tech', () => {
    const link = host.querySelector('a[sheep-list-item]');

    expect(link?.classList.contains('sheep-list-item--selected')).toBe(true);
    expect(link?.getAttribute('aria-current')).toBe('true');
  });

  it('classes the projected slots', () => {
    expect(host.querySelector('.sheep-list__subheader')).toBeTruthy();
    expect(host.querySelector('.sheep-list-item__title')).toBeTruthy();
    expect(host.querySelector('.sheep-list-item__line')).toBeTruthy();
    expect(host.querySelector('.sheep-list-item__meta')).toBeTruthy();
  });
});

@Component({
  imports: [SHEEP_LIST, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport [itemSize]="rowHeight" style="height: 200px">
      <sheep-list divided>
        <sheep-list-item *cdkVirtualFor="let row of rows">
          <div sheepListItemTitle>{{ row }}</div>
        </sheep-list-item>
      </sheep-list>
    </cdk-virtual-scroll-viewport>
  `,
})
class VirtualHostComponent {
  readonly viewport = viewChild.required(CdkVirtualScrollViewport);
  readonly rowHeight = SHEEP_LIST_ROW_HEIGHT.md;
  readonly rows = Array.from({ length: 500 }, (_, i) => `Row ${i}`);
}

describe('SheepListComponent in a virtual viewport', () => {
  let fixture: ComponentFixture<VirtualHostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VirtualHostComponent);
    await fixture.whenStable();
    // The viewport measures itself and computes its first range in a bare
    // microtask outside the scheduler, which `whenStable` does not wait for.
    // Left undrained it lands *after* a test has set a range of its own and
    // puts the original back — so drain it here, before any test acts.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
    host = fixture.nativeElement;
  });

  it('renders a window of rows, not all 500', () => {
    const rendered = host.querySelectorAll('sheep-list-item');

    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(500);
  });

  it('suppresses the first row hairline while the window is at the top', () => {
    const list = host.querySelector('sheep-list');

    expect(list?.classList.contains('sheep-list--continued')).toBe(false);
  });

  it('restores it once the run continues above the rendered window', async () => {
    fixture.componentInstance.viewport().setRenderedRange({
      start: 40,
      end: 60,
    });
    await fixture.whenStable();

    const list = host.querySelector('sheep-list');

    expect(list?.classList.contains('sheep-list--continued')).toBe(true);
  });

  it('never marks a list that has no viewport above it', () => {
    const plain = TestBed.createComponent(HostComponent);
    const list = plain.nativeElement.querySelector('sheep-list');

    expect(list.classList.contains('sheep-list--continued')).toBe(false);
  });
});
