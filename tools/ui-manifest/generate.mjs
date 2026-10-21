// Generates libs/ui/custom-elements.json — a Custom Elements Manifest
// (https://github.com/webcomponents/custom-elements-manifest) describing the
// public API of @sheep-ng/ui, so editors, docs tooling and AI assistants can
// read the library's elements, inputs, outputs and slots without reading its
// source.
//
// Read straight from the TypeScript program, starting at the package's public
// entry point: only what `libs/ui/src/index.ts` exports is described, so the
// manifest and the public API cannot disagree about what exists.
//
//   node tools/ui-manifest/generate.mjs           write the manifest
//   node tools/ui-manifest/generate.mjs --check   fail if it is out of date,
//                                                 or if AGENTS.md omits a
//                                                 public element or directive
//
// Angular components are not registered custom elements, so a few fields are
// read with Angular in mind:
//
// - `tagName` / `customElement` are set only for components with a plain
//   element selector. Attribute-hosted components (`a[sheep-nav-bar-item]`)
//   and directives are still declared, with their full selector, under the
//   `angular` extension field every declaration carries.
// - `attributes` are the component's inputs, named as they are written in a
//   template. `[name]="expr"` binds any of them; a plain `name="text"` works
//   for the string and boolean-attribute ones.
// - `slots` are `<ng-content select>` projection slots, named by their CSS
//   selector rather than by a `slot="…"` attribute. The empty name is the
//   default slot.
// - `events` are outputs, including the `<name>Change` half of every
//   two-way `model()`.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const libRoot = join(root, 'libs/ui');
const entry = join(libRoot, 'src/index.ts');
const outFile = join(libRoot, 'custom-elements.json');
const agentsFile = join(libRoot, 'AGENTS.md');
const packageName = JSON.parse(
  readFileSync(join(libRoot, 'package.json'), 'utf8'),
).name;

/** The module consumers actually import: ng-packagr's single FESM bundle. */
const modulePath = `fesm2022/${packageName.replace('@', '').replace('/', '-')}.mjs`;

// --- program -----------------------------------------------------------------

const config = ts.getParsedCommandLineOfConfigFile(
  join(libRoot, 'tsconfig.lib.json'),
  {},
  { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => fail(d.messageText) },
);
const program = ts.createProgram({ rootNames: [entry], options: config.options });
const checker = program.getTypeChecker();
const entrySource = program.getSourceFile(entry);
const exported = checker.getExportsOfModule(
  checker.getSymbolAtLocation(entrySource),
);

function fail(message) {
  console.error(`ui-manifest: ${message}`);
  process.exit(1);
}

// --- helpers -----------------------------------------------------------------

const resolveAlias = (symbol) =>
  symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

/** JSDoc text, with `{@link X}` and fenced examples kept as written. */
function docs(symbol) {
  return ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replace(/\r\n/g, '\n')
    .trim();
}

/** The first paragraph, for `summary`. */
const firstParagraph = (text) => text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();

const typeFormat =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.WriteArrayAsGenericType;

/**
 * A type as a reader wants it: a named union of literals is spelled out
 * (`'sm' | 'md' | 'lg'`, not `SheepButtonSize`), because the alias name tells
 * nobody which values are allowed.
 */
function typeText(type) {
  if (type.isUnion()) {
    const parts = type.types.map((t) => checker.typeToString(t, undefined, typeFormat));
    const hasTrue = parts.includes('true');
    const hasFalse = parts.includes('false');
    const merged = parts.filter((p) => !(hasTrue && hasFalse && (p === 'true' || p === 'false')));
    if (hasTrue && hasFalse) merged.unshift('boolean');
    // `null` and `undefined` last, the way they are usually written.
    const nullish = merged.filter((p) => p === 'null' || p === 'undefined');
    return [...merged.filter((p) => !nullish.includes(p)), ...nullish].join(' | ');
  }
  return checker.typeToString(type, undefined, typeFormat);
}

function decoratorOf(node) {
  for (const decorator of ts.getDecorators(node) ?? []) {
    const call = decorator.expression;
    if (!ts.isCallExpression(call)) continue;
    const name = call.expression.getText();
    if (['Component', 'Directive', 'Injectable', 'Pipe'].includes(name)) {
      const arg = call.arguments[0];
      const props = {};
      if (arg && ts.isObjectLiteralExpression(arg)) {
        for (const prop of arg.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isStringLiteralLike(prop.initializer)) {
            props[prop.name.getText()] = prop.initializer.text;
          }
          if (ts.isPropertyAssignment(prop) && prop.name.getText() === 'template') {
            props.template = prop.initializer.getText().slice(1, -1);
          }
        }
      }
      return { name, props };
    }
  }
  return null;
}

const isPublic = (member) =>
  !(ts.getCombinedModifierFlags(member) &
    (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) &&
  !(member.name && ts.isPrivateIdentifier(member.name));

/** `input`, `input.required`, `model`, `model.required`, `output`, or null. */
function signalApi(member) {
  const init = member.initializer;
  if (!init || !ts.isCallExpression(init)) return null;
  const callee = init.expression.getText();
  return ['input', 'input.required', 'model', 'model.required', 'output'].includes(callee)
    ? { callee, args: init.arguments }
    : null;
}

/** The `alias` from an `input()` / `model()` options object, if any. */
function aliasOf(args) {
  for (const arg of args) {
    if (!ts.isObjectLiteralExpression(arg)) continue;
    for (const prop of arg.properties) {
      if (ts.isPropertyAssignment(prop) && prop.name.getText() === 'alias') {
        return prop.initializer.text;
      }
    }
  }
  return undefined;
}

/**
 * The type a template may bind: for `input(…, { transform })` that is the
 * transform's input (`boolean | string` for a boolean attribute), not the
 * stored type.
 */
function bindableType(member, api) {
  const type = checker.getTypeAtLocation(member.name);
  const args = type.aliasTypeArguments ?? checker.getTypeArguments(type);
  if (!args?.length) return typeText(type);
  const name = type.symbol?.name ?? '';
  if (name === 'InputSignalWithTransform' && args[1]) {
    // `booleanAttribute` and `numberAttribute` accept `unknown`, which tells a
    // reader nothing; the stored type (`boolean`, `number | undefined`) is
    // what the input means.
    const write = typeText(args[1]);
    if (write !== 'unknown') return write;
  }
  return typeText(args[0]);
}

function slotsOf(sourceFile, props) {
  let html = props.template ?? '';
  if (props.templateUrl) {
    const path = join(dirname(sourceFile.fileName), props.templateUrl);
    if (existsSync(path)) html = readFileSync(path, 'utf8');
  }
  const slots = [];
  for (const match of html.matchAll(/<ng-content\b([^>]*)>/g)) {
    const select = /select="([^"]*)"/.exec(match[1])?.[1] ?? '';
    if (slots.some((slot) => slot.name === select)) continue;
    slots.push({
      name: select,
      description: select
        ? `Content projected into the element that matches \`${select}\`.`
        : 'Default content.',
    });
  }
  return slots;
}

function methodOf(member) {
  const signature = checker.getSignatureFromDeclaration(member);
  return {
    kind: 'method',
    name: member.name.getText(),
    ...(docs(checker.getSymbolAtLocation(member.name)) && {
      description: docs(checker.getSymbolAtLocation(member.name)),
    }),
    parameters: member.parameters.map((p) => ({
      name: p.name.getText(),
      type: { text: typeText(checker.getTypeAtLocation(p)) },
      ...(p.questionToken || p.initializer ? { optional: true } : {}),
      ...(p.initializer ? { default: p.initializer.getText() } : {}),
    })),
    return: { type: { text: typeText(checker.getReturnTypeOfSignature(signature)) } },
  };
}

// --- sets: which exported `SHEEP_*` array carries which class ----------------

const setsByClass = new Map();
for (const symbol of exported.map(resolveAlias)) {
  const decl = symbol.valueDeclaration;
  if (!decl || !ts.isVariableDeclaration(decl) || !decl.initializer) continue;
  let init = decl.initializer;
  while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init)) init = init.expression;
  if (!ts.isArrayLiteralExpression(init)) continue;
  for (const element of init.elements) {
    if (!ts.isIdentifier(element)) continue;
    const target = checker.getSymbolAtLocation(element);
    if (!target) continue;
    const name = resolveAlias(target).name;
    setsByClass.set(name, [...(setsByClass.get(name) ?? []), symbol.name]);
  }
}

// --- declarations ------------------------------------------------------------

const declarations = [];

for (const symbol of exported.map(resolveAlias)) {
  const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!decl) continue;
  const description = docs(symbol);
  const base = {
    name: symbol.name,
    ...(description && { summary: firstParagraph(description), description }),
  };

  if (ts.isClassDeclaration(decl)) {
    const decorator = decoratorOf(decl);
    const sourceFile = decl.getSourceFile();
    const declaration = { kind: 'class', ...base };
    const members = [];
    const attributes = [];
    const events = [];

    for (const member of decl.members) {
      if (!member.name || !isPublic(member)) continue;
      const memberName = member.name.getText();

      if (ts.isMethodDeclaration(member)) {
        members.push(methodOf(member));
        continue;
      }
      if (!ts.isPropertyDeclaration(member)) continue;

      const memberSymbol = checker.getSymbolAtLocation(member.name);
      const memberDocs = docs(memberSymbol);
      const api = decorator && decorator.name !== 'Injectable' ? signalApi(member) : null;

      if (!api) {
        // On a component or directive, a plain public property is plumbing —
        // a feature hook, an id another part reads. On a service it is API.
        if (decorator?.name === 'Component' || decorator?.name === 'Directive') continue;
        members.push({
          kind: 'field',
          name: memberName,
          type: { text: typeText(checker.getTypeAtLocation(member.name)) },
          ...(memberDocs && { description: memberDocs }),
          ...(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly && { readonly: true }),
        });
        continue;
      }

      const type = { text: bindableType(member, api) };

      if (api.callee === 'output') {
        events.push({ name: memberName, type, ...(memberDocs && { description: memberDocs }) });
        continue;
      }

      const required = api.callee.endsWith('.required');
      const defaultArg = !required ? api.args[0] : undefined;
      const attribute = {
        name: aliasOf(api.args) ?? memberName,
        type,
        ...(defaultArg && !ts.isObjectLiteralExpression(defaultArg) && { default: defaultArg.getText() }),
        ...(memberDocs && { description: memberDocs }),
        fieldName: memberName,
        ...(required && { required: true }),
      };
      attributes.push(attribute);
      members.push({
        kind: 'field',
        name: memberName,
        type,
        ...(attribute.default && { default: attribute.default }),
        ...(memberDocs && { description: memberDocs }),
        ...(api.callee.startsWith('model') && { twoWay: true }),
      });

      if (api.callee.startsWith('model')) {
        events.push({
          name: `${attribute.name}Change`,
          type,
          description: `Emits the new value of \`${attribute.name}\`. Bind both halves with \`[(${attribute.name})]\`.`,
        });
      }
    }

    if (decorator && (decorator.name === 'Component' || decorator.name === 'Directive')) {
      const selector = decorator.props.selector ?? '';
      const tagName = selector
        .split(',')
        .map((part) => part.trim())
        .find((part) => /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(part));
      if (tagName) {
        declaration.tagName = tagName;
        declaration.customElement = true;
      }
      if (attributes.length) declaration.attributes = attributes;
      if (events.length) declaration.events = events;
      if (decorator.name === 'Component') {
        const slots = slotsOf(sourceFile, decorator.props);
        if (slots.length) declaration.slots = slots;
      }
    }
    if (members.length) declaration.members = members;

    declaration.angular = {
      kind: (decorator?.name ?? 'class').toLowerCase(),
      ...(decorator?.props.selector && { selector: decorator.props.selector }),
      ...(decorator?.props.exportAs && { exportAs: decorator.props.exportAs }),
      import: { from: packageName, name: symbol.name },
      ...(setsByClass.has(symbol.name) && { includedIn: setsByClass.get(symbol.name) }),
      source: relative(libRoot, sourceFile.fileName).replaceAll('\\', '/'),
    };
    declarations.push(declaration);
    continue;
  }

  if (ts.isFunctionDeclaration(decl)) {
    const signature = checker.getSignatureFromDeclaration(decl);
    declarations.push({
      kind: 'function',
      ...base,
      parameters: decl.parameters.map((p) => ({
        name: p.name.getText(),
        type: { text: typeText(checker.getTypeAtLocation(p)) },
        ...(p.questionToken || p.initializer ? { optional: true } : {}),
      })),
      return: { type: { text: typeText(checker.getReturnTypeOfSignature(signature)) } },
      angular: { import: { from: packageName, name: symbol.name } },
    });
    continue;
  }

  if (ts.isVariableDeclaration(decl)) {
    const init = decl.initializer?.getText() ?? '';
    declarations.push({
      kind: 'variable',
      ...base,
      type: { text: typeText(checker.getTypeAtLocation(decl.name)) },
      // Short initialisers only: a value set or an import set is worth
      // showing, a message table or an injection token is not.
      ...(init &&
        init.length <= 400 &&
        !init.includes('\n\n') && {
          default: init
            .replace(/\s+as const$/, '')
            .replace(/\s+/g, ' ')
            .replace(/\[ /g, '[')
            .replace(/,? \]/g, ']'),
        }),
      angular: { import: { from: packageName, name: symbol.name } },
    });
  }
  // Interfaces and type aliases have no place in the schema; they ship in the
  // package's .d.ts files, and the attribute types above are already expanded.
}

// --- manifest ----------------------------------------------------------------

const manifest = {
  schemaVersion: '2.1.0',
  readme: 'AGENTS.md',
  modules: [
    {
      kind: 'javascript-module',
      path: modulePath,
      declarations,
      exports: [
        ...declarations.map((d) => ({
          kind: 'js',
          name: d.name,
          declaration: { name: d.name, module: modulePath },
        })),
        ...declarations
          .filter((d) => d.tagName)
          .map((d) => ({
            kind: 'custom-element-definition',
            name: d.tagName,
            declaration: { name: d.name, module: modulePath },
          })),
      ],
    },
  ],
};

const json = `${JSON.stringify(manifest, null, 2)}\n`;

// --- AGENTS.md coverage ------------------------------------------------------

/**
 * Every public element and directive should be named in AGENTS.md: an agent
 * reading the guide and not finding one will assume it does not exist.
 */
function agentsGaps() {
  if (!existsSync(agentsFile)) return ['AGENTS.md is missing'];
  const guide = readFileSync(agentsFile, 'utf8');
  const missing = [];
  for (const d of declarations) {
    const kind = d.angular?.kind;
    if (kind !== 'component' && kind !== 'directive') continue;
    const selector = d.angular.selector;
    // A tag, or the attribute that triggers it.
    const handle =
      d.tagName ??
      /\[([a-zA-Z-]+)\]/.exec(selector)?.[1] ??
      selector;
    if (!guide.includes(handle)) missing.push(`${d.name} (${handle})`);
  }
  return missing;
}

if (process.argv.includes('--check')) {
  const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
  const problems = [];
  if (current.replace(/\r\n/g, '\n') !== json) {
    problems.push(
      'custom-elements.json is out of date — run `npx nx run ui:manifest` and commit the result.',
    );
  }
  const gaps = agentsGaps();
  if (gaps.length) {
    problems.push(`AGENTS.md does not mention: ${gaps.join(', ')}`);
  }
  if (problems.length) fail(problems.join('\n'));
  console.log('ui-manifest: custom-elements.json and AGENTS.md are up to date.');
} else {
  writeFileSync(outFile, json);
  const elements = declarations.filter((d) => d.tagName).length;
  console.log(
    `ui-manifest: wrote ${relative(root, outFile)} — ${declarations.length} declarations, ${elements} elements.`,
  );
  const gaps = agentsGaps();
  if (gaps.length) console.warn(`ui-manifest: AGENTS.md does not mention: ${gaps.join(', ')}`);
}
