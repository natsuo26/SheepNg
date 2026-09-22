import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepTreeComponent } from './sheep-tree.component';
import type { SheepTreeNode } from './sheep-tree.constants';

/** A small fixed hierarchy: two roots, the first with a grandchild under it. */
const NODES: readonly SheepTreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'app',
        label: 'app',
        children: [{ id: 'main', label: 'main.ts' }],
      },
      { id: 'index', label: 'index.html' },
    ],
  },
  { id: 'readme', label: 'README.md', disabled: true },
];

/** A chain `n0 -> n1 -> ... -> n{depth-1}`, for the depth cases. */
function chain(depth: number): SheepTreeNode {
  let node: SheepTreeNode = { id: `n${depth - 1}`, label: `n${depth - 1}` };

  for (let i = depth - 2; i >= 0; i--) {
    node = { id: `n${i}`, label: `n${i}`, children: [node] };
  }

  return node;
}

@Component({
  imports: [SheepTreeComponent],
  template: `
    <sheep-tree
      [nodes]="nodes()"
      [(expanded)]="expanded"
      [(selected)]="selected"
      (nodeToggled)="toggled.set($event.id)"
    />
  `,
})
class Host {
  readonly nodes = signal<readonly SheepTreeNode[]>(NODES);
  readonly expanded = signal<ReadonlySet<string>>(new Set<string>());
  readonly selected = signal<string | null>(null);
  readonly toggled = signal<string | null>(null);
}

describe('SheepTreeComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.sheep-tree__row'));

  const labels = (): string[] =>
    rows().map((row) =>
      (
        row.querySelector('.sheep-tree__label') as HTMLElement
      ).textContent?.trim() ?? '',
    );

  const tree = (): HTMLElement =>
    fixture.nativeElement.querySelector('sheep-tree');

  const press = (key: string) =>
    tree().dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  it('shows only the roots while nothing is expanded', () => {
    expect(labels()).toEqual(['src', 'README.md']);
  });

  it('renders every visible node as a sibling, whatever its depth', async () => {
    host.expanded.set(new Set(['src', 'app']));
    await settle();

    // Four levels of data, one level of DOM: every row is a child of the tree.
    const parents = new Set(rows().map((row) => row.parentElement));

    expect(labels()).toEqual([
      'src',
      'app',
      'main.ts',
      'index.html',
      'README.md',
    ]);
    expect(parents.size).toBe(1);
  });

  it('reports depth through aria-level rather than nesting', async () => {
    host.expanded.set(new Set(['src', 'app']));
    await settle();

    expect(rows().map((row) => row.getAttribute('aria-level'))).toEqual([
      '1',
      '2',
      '3',
      '2',
      '1',
    ]);
  });

  it('indents by level with a custom property', async () => {
    host.expanded.set(new Set(['src']));
    await settle();

    expect(rows()[0].style.getPropertyValue('--_tree-level')).toBe('0');
    expect(rows()[1].style.getPropertyValue('--_tree-level')).toBe('1');
  });

  it('skips collapsed subtrees entirely', async () => {
    // A deep chain, collapsed, is one row — the flatten never walks into it.
    host.nodes.set([chain(500)]);
    await settle();

    expect(rows().length).toBe(1);
  });

  it('keeps one row per node at extreme depth', async () => {
    const depth = 200;
    host.nodes.set([chain(depth)]);
    host.expanded.set(
      new Set(Array.from({ length: depth }, (_, i) => `n${i}`)),
    );
    await settle();

    expect(rows().length).toBe(depth);
    expect(rows()[depth - 1].getAttribute('aria-level')).toBe(String(depth));
    expect(new Set(rows().map((row) => row.parentElement)).size).toBe(1);
  });

  it('draws a twisty only on nodes with children', () => {
    expect(rows()[0].querySelector('.sheep-tree__twisty--leaf')).toBe(null);
    expect(rows()[1].querySelector('.sheep-tree__twisty--leaf')).toBeTruthy();
  });

  it('toggles on the twisty without selecting', async () => {
    (rows()[0].querySelector('.sheep-tree__twisty') as HTMLElement).click();
    await settle();

    expect(host.expanded().has('src')).toBe(true);
    expect(host.toggled()).toBe('src');
    expect(host.selected()).toBe(null);
  });

  it('collapses again on a second twisty click', async () => {
    const twisty = () => rows()[0].querySelector('.sheep-tree__twisty') as HTMLElement;

    twisty().click();
    await settle();
    twisty().click();
    await settle();

    expect(host.expanded().has('src')).toBe(false);
    expect(labels()).toEqual(['src', 'README.md']);
  });

  it('writes a new set rather than mutating the caller one', async () => {
    const before = host.expanded();
    (rows()[0].querySelector('.sheep-tree__twisty') as HTMLElement).click();
    await settle();

    expect(host.expanded()).not.toBe(before);
    expect(before.has('src')).toBe(false);
  });

  it('selects on a row click', async () => {
    rows()[0].click();
    await settle();

    expect(host.selected()).toBe('src');
    expect(rows()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('refuses to select a disabled node', async () => {
    rows()[1].click();
    await settle();

    expect(host.selected()).toBe(null);
  });

  it('holds exactly one tab stop', async () => {
    host.expanded.set(new Set(['src']));
    await settle();

    const stops = rows().filter((row) => row.getAttribute('tabindex') === '0');

    expect(stops.length).toBe(1);
    expect(stops[0]).toBe(rows()[0]);
  });

  it('moves the tab stop down and up with the arrow keys', async () => {
    press('ArrowDown');
    await settle();
    expect(rows()[1].getAttribute('tabindex')).toBe('0');

    press('ArrowUp');
    await settle();
    expect(rows()[0].getAttribute('tabindex')).toBe('0');
  });

  it('expands with ArrowRight, then steps into the branch', async () => {
    press('ArrowRight');
    await settle();
    expect(host.expanded().has('src')).toBe(true);

    press('ArrowRight');
    await settle();
    expect(rows()[1].getAttribute('tabindex')).toBe('0');
  });

  it('collapses with ArrowLeft, then steps out to the parent', async () => {
    host.expanded.set(new Set(['src', 'app']));
    await settle();

    // Focus the grandchild, two levels in.
    press('ArrowDown');
    press('ArrowDown');
    await settle();
    expect(rows()[2].getAttribute('tabindex')).toBe('0');

    // A leaf: ArrowLeft steps out rather than collapsing.
    press('ArrowLeft');
    await settle();
    expect(rows()[1].getAttribute('tabindex')).toBe('0');

    // An open branch: ArrowLeft closes it.
    press('ArrowLeft');
    await settle();
    expect(host.expanded().has('app')).toBe(false);
  });

  it('jumps to the ends with Home and End', async () => {
    press('End');
    await settle();
    expect(rows()[rows().length - 1].getAttribute('tabindex')).toBe('0');

    press('Home');
    await settle();
    expect(rows()[0].getAttribute('tabindex')).toBe('0');
  });

  it('selects with Enter and Space', async () => {
    press('Enter');
    await settle();
    expect(host.selected()).toBe('src');

    // Settle first: without it the component model still holds 'src', and
    // re-setting the same value is a no-op that never writes back.
    host.selected.set(null);
    await settle();

    press(' ');
    await settle();
    expect(host.selected()).toBe('src');
  });

  it('stops at the ends rather than wrapping', async () => {
    press('ArrowUp');
    await settle();
    expect(rows()[0].getAttribute('tabindex')).toBe('0');

    press('End');
    press('ArrowDown');
    await settle();
    expect(rows()[rows().length - 1].getAttribute('tabindex')).toBe('0');
  });

  it('leaves unrelated keys to the browser', async () => {
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    });
    tree().dispatchEvent(event);
    await settle();

    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps expansion when the data is replaced', async () => {
    host.expanded.set(new Set(['src']));
    await settle();

    // Same ids, new objects — expansion is keyed by id, not by identity.
    host.nodes.set(structuredClone(NODES) as SheepTreeNode[]);
    await settle();

    expect(labels()).toEqual(['src', 'app', 'index.html', 'README.md']);
  });
});
