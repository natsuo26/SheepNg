import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SheepButtonComponent,
  type SheepButtonSize,
  type SheepButtonTone,
  type SheepButtonVariant,
} from '@sheep-ng/ui';

/**
 * Showcase for every axis of `sheep-button`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page. The kit itself
 * reads only `--sheep-*` roles, so the surrounding page re-themes in step
 * with the buttons it frames.
 */
@Component({
  selector: 'sheep-demo-button',
  imports: [SheepButtonComponent],
  templateUrl: './button-demo.html',
  styleUrl: './button-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemo {
  protected readonly variants: readonly SheepButtonVariant[] = [
    'outline',
    'solid',
    'soft',
    'ghost',
    'link',
  ];

  protected readonly tones: readonly SheepButtonTone[] = [
    'primary',
    'neutral',
    'success',
    'warning',
    'danger',
  ];

  protected readonly sizes: readonly SheepButtonSize[] = ['sm', 'md', 'lg'];

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'matrix',
      heading: 'Variants × tones',
      note: 'Outline is the default. Solid is the exception, spent once per view.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Three heights shared by every control in the library, so a button, a text field and a select land on the same row.',
    },
    {
      id: 'icons',
      heading: 'Icons and icon-only',
      note: 'shape="square" is a 1:1 box at the control height; ariaLabel is required.',
    },
    {
      id: 'states',
      heading: 'States',
      note: 'Focus is a 2px accent outline. Loading stays at full strength — busy is not dead.',
    },
    {
      id: 'column',
      heading: 'In a column',
      note: 'No fullWidth input — the caller sizes the wrapper.',
    },
    {
      id: 'coupled',
      heading: 'Tightly coupled',
      note: 'The same two buttons, in code and rendered. No style hooks pass through.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Four appearance inputs, three behaviour inputs. Nothing else is styleable from the call site.',
    },
  ];

  /**
   * The markup behind each specimen, keyed by section.
   *
   * Every example on the page is a few lines of HTML and nothing else, so the
   * page shows those lines rather than describing them. A section with its own
   * coupled code block is absent here — it already has one.
   */
  protected readonly snippets: Record<string, string> = {
    matrix: `<sheep-button>Cancel</sheep-button>
<sheep-button variant="solid">Publish</sheep-button>
<sheep-button variant="soft" tone="success">Approve</sheep-button>
<sheep-button variant="ghost" tone="neutral">Dismiss</sheep-button>
<sheep-button variant="link" tone="danger">Delete</sheep-button>`,

    sizes: `<sheep-button size="sm">Small</sheep-button>
<sheep-button>Medium</sheep-button>
<sheep-button size="lg">Large</sheep-button>`,

    icons: `<sheep-button tone="success">
  <svg sheepButtonStart viewBox="0 0 24 24">...</svg>
  Approve
</sheep-button>

<sheep-button variant="ghost" tone="neutral">
  Continue
  <svg sheepButtonEnd viewBox="0 0 24 24">...</svg>
</sheep-button>

<sheep-button shape="square" ariaLabel="Add item">
  <svg sheepButtonStart viewBox="0 0 24 24">...</svg>
</sheep-button>`,

    states: `<sheep-button (click)="count()">Clicked {{ clicks() }}</sheep-button>

<sheep-button variant="solid" [loading]="saving()" (click)="save()">
  Save changes
</sheep-button>

<sheep-button disabled>Disabled</sheep-button>`,

    column: `<div class="actions">
  <sheep-button variant="solid" size="lg">Create account</sheep-button>
  <sheep-button variant="ghost" tone="neutral">Maybe later</sheep-button>
</div>

.actions { display: flex; flex-direction: column; }`,

    api: `import { SheepButtonComponent } from '@sheep-ng/ui';

@Component({ imports: [SheepButtonComponent], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'variant',
      default: "'outline'",
      type: "'outline' | 'solid' | 'soft' | 'ghost' | 'link'",
    },
    {
      name: 'tone',
      default: "'primary'",
      type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
    },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    { name: 'shape', default: "'rounded'", type: "'rounded' | 'square'" },
    { name: 'disabled', default: 'false', type: 'boolean attribute' },
    { name: 'loading', default: 'false', type: 'boolean attribute' },
    { name: 'ariaLabel', default: 'null', type: 'string | null' },
  ];

  /** Rendered verbatim next to the buttons it describes. */
  protected readonly snippet = `<sheep-button>Cancel</sheep-button>
<sheep-button variant="solid">Publish</sheep-button>

/* There is no third line. Appearance is not a
   call-site concern - retheme in _sheep-theme-spec.scss. */`;

  protected readonly saving = signal(false);
  protected readonly clicks = signal(0);

  protected save(): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1500);
  }

  protected count(): void {
    this.clicks.update((n) => n + 1);
  }
}
