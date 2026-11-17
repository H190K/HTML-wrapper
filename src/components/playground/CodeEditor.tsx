import type { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import type { Lang } from '@/lib/types';
import { $activeLang, $docVersion, $project, setCode } from '@/stores/playground';
import { createEditorState, wrapCompartment, wrapExtension } from './editor-setup';

const LANGS: Lang[] = ['html', 'css', 'js'];

/**
 * One EditorView, three EditorStates. Switching lanes swaps the state, so each lane keeps its own
 * undo history, selection and scroll. States live at module scope so a layout change (desktop <-> phone)
 * that remounts this component does not lose history either.
 */
const cache: { version: number; wrap: boolean; states: Partial<Record<Lang, EditorState>> } = {
  version: -1,
  wrap: false,
  states: {},
};

interface Props {
  wrap: boolean;
  onCursor: (line: number, col: number) => void;
}

export function CodeEditor({ wrap, onCursor }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const shownLang = useRef<Lang>($activeLang.get());
  const cursorCb = useRef(onCursor);
  cursorCb.current = onCursor;

  const lang = useStore($activeLang);
  const version = useStore($docVersion);

  const build = (l: Lang) =>
    createEditorState(l, $project.get()[l], {
      wrap: cache.wrap,
      onChange: setCode,
      onCursor: (line, col) => cursorCb.current(line, col),
    });

  const ensureStates = () => {
    if (cache.version !== $docVersion.get()) {
      cache.version = $docVersion.get();
      cache.states = {};
    }
    for (const l of LANGS) cache.states[l] ??= build(l);
    return cache.states as Record<Lang, EditorState>;
  };

  // Mount the view once.
  useEffect(() => {
    if (!host.current) return;
    cache.wrap = wrap;
    const states = ensureStates();
    shownLang.current = $activeLang.get();
    const v = new EditorView({ state: states[shownLang.current], parent: host.current });
    view.current = v;
    const line = v.state.doc.lineAt(v.state.selection.main.head);
    onCursor(line.number, v.state.selection.main.head - line.from + 1);
    return () => {
      cache.states[shownLang.current] = v.state;
      v.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Project replaced wholesale (template, reset, share): rebuild every lane.
  useEffect(() => {
    const v = view.current;
    if (!v || cache.version === version) return;
    const states = ensureStates();
    v.setState(states[$activeLang.get()]);
    shownLang.current = $activeLang.get();
  }, [version]);

  // Lane switch: park the current state, show the next one.
  useEffect(() => {
    const v = view.current;
    if (!v || shownLang.current === lang) return;
    cache.states[shownLang.current] = v.state;
    const states = ensureStates();
    v.setState(states[lang]);
    shownLang.current = lang;
    const head = v.state.selection.main.head;
    const line = v.state.doc.lineAt(head);
    onCursor(line.number, head - line.from + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Word wrap applies to every lane.
  useEffect(() => {
    if (cache.wrap === wrap) return;
    cache.wrap = wrap;
    const v = view.current;
    const effect = wrapCompartment.reconfigure(wrapExtension(wrap));
    for (const l of LANGS) {
      if (v && l === shownLang.current) v.dispatch({ effects: effect });
      else if (cache.states[l]) cache.states[l] = cache.states[l]!.update({ effects: effect }).state;
    }
  }, [wrap]);

  return <div ref={host} className="cm-host h-full min-h-0" />;
}
