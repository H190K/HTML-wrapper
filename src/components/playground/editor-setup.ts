import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { Lang } from '@/lib/types';

/**
 * Editor chrome and syntax colours read the CSS custom properties defined in global.css / playground.css,
 * so the same extension renders correctly in light and dark themes without reconfiguring.
 */
const chrome = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--ink)',
    backgroundColor: 'var(--surface)',
    fontSize: 'var(--editor-font-size, 13.5px)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.65',
    overscrollBehavior: 'contain',
  },
  '.cm-content': { padding: '12px 0 40vh', caretColor: 'var(--track)' },
  '.cm-line': { padding: '0 16px 0 12px' },
  '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--track)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--syn-selection) !important',
  },
  '.cm-activeLine': { backgroundColor: 'var(--syn-active-line)' },
  '.cm-gutters': {
    backgroundColor: 'var(--surface)',
    color: 'var(--muted)',
    border: 'none',
    borderRight: '1px solid var(--line)',
    fontSize: '0.86em',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px', minWidth: '40px' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--syn-active-line)', color: 'var(--ink)' },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'transparent',
    outline: '1px solid var(--track)',
    borderRadius: '2px',
  },
  '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: 'transparent', outline: '1px solid var(--danger)' },
  '.cm-selectionMatch': { backgroundColor: 'var(--syn-match)' },
  '.cm-searchMatch': { backgroundColor: 'var(--syn-match)', outline: '1px solid var(--line-strong)' },
  '.cm-panels': { backgroundColor: 'var(--surface-2)', color: 'var(--ink)' },
  '.cm-panels.cm-panels-top': { borderBottom: '1px solid var(--line)' },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--line)' },
  '.cm-tooltip': {
    border: '1px solid var(--line-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--surface)',
    color: 'var(--ink)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--ink)',
    color: 'var(--paper)',
  },
  '.cm-completionDetail': { color: 'var(--muted)' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.definitionKeyword, t.modifier], color: 'var(--syn-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: 'var(--syn-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.tagName], color: 'var(--syn-tag)' },
  { tag: [t.attributeName], color: 'var(--syn-attr)' },
  { tag: [t.attributeValue], color: 'var(--syn-string)' },
  { tag: [t.propertyName], color: 'var(--syn-property)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--syn-function)' },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: 'var(--ink)' },
  { tag: [t.className, t.typeName], color: 'var(--syn-number)' },
  { tag: [t.constant(t.variableName), t.standard(t.variableName)], color: 'var(--syn-number)' },
  { tag: [t.angleBracket, t.punctuation, t.separator, t.bracket], color: 'var(--syn-punct)' },
  { tag: [t.operator], color: 'var(--ink-2)' },
  { tag: [t.heading], fontWeight: '700' },
  { tag: [t.invalid], color: 'var(--danger)' },
]);

function language(lang: Lang): Extension {
  if (lang === 'html') return html({ autoCloseTags: true });
  if (lang === 'css') return css();
  return javascript();
}

const LABELS: Record<Lang, string> = { html: 'HTML editor', css: 'CSS editor', js: 'JavaScript editor' };

export const wrapCompartment = new Compartment();

export const wrapExtension = (on: boolean): Extension => (on ? EditorView.lineWrapping : []);

export function createEditorState(
  lang: Lang,
  doc: string,
  opts: { wrap: boolean; onChange: (lang: Lang, value: string) => void; onCursor: (line: number, col: number) => void },
): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      indentUnit.of('  '),
      EditorState.tabSize.of(2),
      bracketMatching(),
      closeBrackets(),
      autocompletion({ icons: false }),
      rectangularSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
      syntaxHighlighting(highlight),
      chrome,
      language(lang),
      wrapCompartment.of(wrapExtension(opts.wrap)),
      EditorView.contentAttributes.of({ 'aria-label': LABELS[lang] }),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange(lang, u.state.doc.toString());
        if (u.selectionSet || u.docChanged || u.focusChanged) {
          const head = u.state.selection.main.head;
          const line = u.state.doc.lineAt(head);
          opts.onCursor(line.number, head - line.from + 1);
        }
      }),
    ],
  });
}
