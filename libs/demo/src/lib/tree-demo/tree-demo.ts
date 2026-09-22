import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SheepButtonComponent,
  SheepTreeComponent,
  type SheepTreeNode,
  type SheepTreeSize,
} from '@sheep-ng/ui';

/** A chain `n0 -> n1 -> ... -> n{depth-1}`, for the depth specimen. */
function chain(depth: number): SheepTreeNode {
  let node: SheepTreeNode = { id: `n${depth - 1}`, label: `level ${depth}` };

  for (let i = depth - 2; i >= 0; i--) {
    node = { id: `n${i}`, label: `level ${i + 1}`, children: [node] };
  }

  return node;
}

/** A full `branching`-ary tree of the given depth, for the scale specimen. */
function generate(depth: number, branching: number, prefix = 'g'): SheepTreeNode {
  const children =
    depth > 0
      ? Array.from({ length: branching }, (_, i) =>
          generate(depth - 1, branching, `${prefix}.${i}`),
        )
      : undefined;

  return {
    id: prefix,
    label: children ? `branch ${prefix}` : `leaf ${prefix}`,
    children,
  };
}

/** Counts every node in a hierarchy, expanded or not. */
function countAll(nodes: readonly SheepTreeNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += 1 + (node.children ? countAll(node.children) : 0);
  }
  return total;
}

/** Counts what a given expansion actually puts on screen. */
function countVisible(
  nodes: readonly SheepTreeNode[],
  expanded: ReadonlySet<string>,
): number {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.children?.length && expanded.has(node.id)) {
      total += countVisible(node.children, expanded);
    }
  }
  return total;
}

/**
 * Showcase for `sheep-tree`.
 *
 * The page is built to make one claim checkable: depth is free. The depth and
 * scale sections put the numbers on screen — how many nodes are in the data
 * against how many rows are in the DOM — because that gap is the whole design.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-tree',
  imports: [SheepTreeComponent, SheepButtonComponent],
  templateUrl: './tree-demo.html',
  styleUrl: './tree-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeDemo {
  protected readonly sizes: readonly SheepTreeSize[] = ['sm', 'md', 'lg'];

  /** The everyday example: a small project tree. */
  protected readonly files: readonly SheepTreeNode[] = [
    {
      id: 'libs',
      label: 'libs',
      children: [
        {
          id: 'ui',
          label: 'ui',
          children: [
            {
              id: 'tree',
              label: 'sheep-tree',
              children: [
                { id: 'tree-ts', label: 'sheep-tree.component.ts' },
                { id: 'tree-html', label: 'sheep-tree.component.html' },
                { id: 'tree-scss', label: 'sheep-tree.component.scss' },
              ],
            },
            { id: 'index', label: 'index.ts' },
          ],
        },
        { id: 'demo', label: 'demo' },
      ],
    },
    {
      id: 'apps',
      label: 'apps',
      children: [{ id: 'demo-app', label: 'demo-app' }],
    },
    { id: 'readme', label: 'README.md' },
    { id: 'lock', label: 'package-lock.json', disabled: true },
  ];

  protected readonly filesExpanded = signal<ReadonlySet<string>>(
    new Set(['libs', 'ui']),
  );
  protected readonly filesSelected = signal<string | null>('tree-ts');

  /** One expansion per size specimen, so the three do not share state. */
  protected readonly sizeExpanded = signal<ReadonlySet<string>>(
    new Set(['libs', 'ui']),
  );

  // -- Depth ---------------------------------------------------------------

  protected readonly DEPTH = 60;

  protected readonly deep: readonly SheepTreeNode[] = [chain(this.DEPTH)];

  protected readonly deepExpanded = signal<ReadonlySet<string>>(
    new Set<string>(),
  );

  protected readonly deepVisible = computed(() =>
    countVisible(this.deep, this.deepExpanded()),
  );

  protected openChain(): void {
    this.deepExpanded.set(
      new Set(Array.from({ length: this.DEPTH }, (_, i) => `n${i}`)),
    );
  }

  protected closeChain(): void {
    this.deepExpanded.set(new Set<string>());
  }

  // -- Scale ---------------------------------------------------------------

  /** A full ternary tree, eight levels deep: just under ten thousand nodes. */
  protected readonly big: readonly SheepTreeNode[] = [generate(8, 3)];

  protected readonly bigExpanded = signal<ReadonlySet<string>>(
    new Set<string>(),
  );

  protected readonly bigTotal = countAll(this.big);

  protected readonly bigVisible = computed(() =>
    countVisible(this.big, this.bigExpanded()),
  );

  protected collapseBig(): void {
    this.bigExpanded.set(new Set<string>());
  }

  // -- Page ----------------------------------------------------------------

  protected readonly snippet = `<sheep-tree
  [nodes]="folders"
  [(expanded)]="open"
  [(selected)]="current"
  (nodeSelected)="load($event)"
/>`;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'Data in, two pieces of state out. The tree takes nodes and owns nothing about them — expansion is a set of ids you hold, selection is one id you hold, and neither is written back onto your data.',
    },
    {
      id: 'flat',
      heading: 'Why it does not nest',
      note: 'The obvious tree is a component that renders itself per child, which costs an instance, an embedded view and a change-detection node at every level, stacked as deep as the data. This one flattens the visible nodes into one array and renders a single flat loop. Depth becomes padding, so every row costs the same whatever its level — and the DOM stays one level deep.',
    },
    {
      id: 'depth',
      heading: 'Depth is free',
      note: 'Sixty levels of nesting. Open the whole chain: sixty rows, all siblings, one level of DOM. A nested tree would be sixty component instances inside one another here.',
    },
    {
      id: 'scale',
      heading: 'Scale',
      note: 'Just under ten thousand nodes. Collapsed, that is one row — the flatten walks into a node only when it is expanded, so a closed branch is skipped whole however much is under it. Work is proportional to what is on screen, never to what is in the data.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'The same three densities as the list, and the same row heights, because a tree row is a list row with an indent in front of it.',
    },
    {
      id: 'keyboard',
      heading: 'Keyboard',
      note: 'The standard tree pattern. The tree is one tab stop and the arrows move inside it.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Three inputs, two of them two-way, and two outputs. Nothing is styleable from the call site.',
    },
  ];

  protected readonly keys: readonly { key: string; does: string }[] = [
    { key: 'Down / Up', does: 'move to the next or previous visible row' },
    { key: 'Right', does: 'expand a closed branch, else step into it' },
    { key: 'Left', does: 'collapse an open branch, else step out to the parent' },
    { key: 'Home / End', does: 'jump to the first or last visible row' },
    { key: 'Enter / Space', does: 'select the focused row' },
  ];

  /** The markup behind each specimen, keyed by section. */
  protected readonly snippets: Record<string, string> = {
    anatomy: `nodes = [
  { id: 'libs', label: 'libs', children: [
    { id: 'ui', label: 'ui', children: [...] },
  ]},
  { id: 'readme', label: 'README.md' },
  { id: 'lock', label: 'package-lock.json', disabled: true },
];

open = signal(new Set(['libs', 'ui']));
current = signal<string | null>(null);`,

    flat: `/* What renders, at any depth: */
<div role="treeitem" aria-level="1" style="--_tree-level: 0">...</div>
<div role="treeitem" aria-level="2" style="--_tree-level: 1">...</div>
<div role="treeitem" aria-level="3" style="--_tree-level: 2">...</div>

/* Siblings, not descendants. Depth is the custom property,
   which the stylesheet turns into padding. */`,

    scale: `/* Expansion is a set of ids, so opening a path is a write: */
open.set(new Set(['g', 'g.0', 'g.0.1']));`,

    api: `import { SheepTreeComponent } from '@sheep-ng/ui';

@Component({ imports: [SheepTreeComponent], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'nodes', default: '[]', type: 'SheepTreeNode[] — id, label, children?, disabled?' },
    { name: 'expanded', default: 'empty set', type: 'two-way ReadonlySet<string> of node ids' },
    { name: 'selected', default: 'null', type: 'two-way string | null' },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    { name: '(nodeSelected)', default: '—', type: 'SheepTreeNode' },
    { name: '(nodeToggled)', default: '—', type: 'SheepTreeNode' },
    { name: 'toggle() / select()', default: '—', type: 'the same state, called instead of bound' },
    {
      name: 'SHEEP_TREE_ROW_HEIGHT',
      default: '28 / 36 / 44',
      type: 'itemSize for a cdk-virtual-scroll-viewport',
    },
  ];
}
