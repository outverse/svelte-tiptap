import type { EditorOptions } from '@tiptap/core';
import { readable, type Readable } from 'svelte/store';

import { Editor } from './Editor';
import { getAllContexts } from 'svelte';

// store a tree of contexts
export const tree = {
  context: new Map(),
};

/** Set the editor context. Must be called during component initialisation. */
export const setEditorContext = () => {
  tree.context = getAllContexts();
};

const createEditor = (options: Partial<EditorOptions>): Readable<Editor> => {
  const editor = new Editor(options);

  const { subscribe } = readable(editor, (set) => {
    editor.on('transaction', () => {
      set(editor);
    });

    return () => {
      editor.destroy();
    };
  });

  return { subscribe };
};

export default createEditor;
