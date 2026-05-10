'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlock from '@tiptap/extension-code-block';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Folder, Italic, Minus, Plus, Underline as UnderlineIcon, X } from 'lucide-react';
import { BlockInsertMenu } from '@/components/notebook/BlockInsertMenu';
import { EditorToolbar } from '@/components/notebook/EditorToolbar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMacros } from '@/hooks/useMacros';
import { useNotebook } from '@/hooks/useNotebook';
import { useResizableNode } from '@/hooks/useResizableNode';
import { cn } from '@/lib/utils';
import { db, type Note } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] };
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fde047' },
  { name: 'Peach', value: '#fed7aa' },
  { name: 'Pink', value: '#fecaca' },
  { name: 'Lavender', value: '#e9d5ff' },
  { name: 'Mint', value: '#bbf7d0' },
];

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('width') || '100%',
        renderHTML: (attributes) => ({ width: attributes.width }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

const ResizableCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') || '100%',
        renderHTML: (attributes) => ({ 'data-width': attributes.width }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableCodeBlockView);
  },
});

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-sm text-gray-400">Select a note or create a new one</p>
    </div>
  );
}

function parseNoteContent(content: unknown): JSONContent {
  if (!content) {
    return EMPTY_DOC;
  }

  if (typeof content === 'string') {
    try {
      return JSON.parse(content) as JSONContent;
    } catch {
      return EMPTY_DOC;
    }
  }

  return content as JSONContent;
}

function getWordCount(storage: unknown) {
  const characterCount = storage as { words?: () => number } | undefined;
  return characterCount?.words?.() ?? 0;
}

function ResizableImageView({ node, selected, updateAttributes }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthAttr = typeof node.attrs.width === 'string' ? node.attrs.width : '100%';
  const { width, handleMouseDown } = useResizableNode(
    containerRef,
    widthAttr,
    useCallback(
      (nextWidth: string) => updateAttributes({ width: nextWidth }),
      [updateAttributes],
    ),
  );

  return (
    <NodeViewWrapper className="my-2">
      <div ref={containerRef} className="relative" style={{ width }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Tiptap NodeView image content is user-authored and stored locally. */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="block h-auto max-w-full rounded-lg"
          draggable={false}
        />
        {selected && (
          <button
            type="button"
            onMouseDown={handleMouseDown}
            className="absolute bottom-1 right-1 h-2.5 w-2.5 cursor-nw-resize rounded-sm border border-black/20 bg-white/90 shadow-sm"
            title="Resize image"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

function ResizableCodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthAttr = typeof node.attrs.width === 'string' ? node.attrs.width : '100%';
  const { width, handleMouseDown } = useResizableNode(
    containerRef,
    widthAttr,
    useCallback(
      (nextWidth: string) => updateAttributes({ width: nextWidth }),
      [updateAttributes],
    ),
    200,
  );

  return (
    <NodeViewWrapper className="my-2">
      <div ref={containerRef} className="relative" style={{ width }}>
        <pre className="m-0 rounded-lg bg-black/[0.05] p-4">
          <NodeViewContent as={'code' as 'div'} />
        </pre>
        <button
          type="button"
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 flex h-full w-3 cursor-ew-resize items-center justify-center rounded-r-lg bg-indigo-500/15 text-indigo-700/70 opacity-70 transition-opacity hover:opacity-100"
          title="Resize code block"
        >
          <span className="text-[10px] leading-none">||</span>
        </button>
        <span className="absolute bottom-1 right-4 rounded bg-white/75 px-1.5 py-0.5 text-[10px] leading-none text-gray-500">
          resize
        </span>
      </div>
    </NodeViewWrapper>
  );
}

interface TablePos {
  top: number;
  left: number;
  width: number;
  height: number;
  rowCount: number;
  colCount: number;
}

function measureTable(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  scrollContainer: HTMLElement,
): TablePos | null {
  const { $anchor } = editor.state.selection;
  let tableBeforePos = -1;
  let rowCount = 0;
  let colCount = 0;

  for (let d = $anchor.depth; d > 0; d--) {
    const node = $anchor.node(d);
    if (node.type.name === 'table') {
      tableBeforePos = $anchor.before(d);
      rowCount = node.childCount;
      colCount = node.firstChild?.childCount ?? 1;
      break;
    }
  }

  if (tableBeforePos === -1) return null;

  const domNode = editor.view.nodeDOM(tableBeforePos);
  if (!(domNode instanceof HTMLElement)) return null;

  const containerRect = scrollContainer.getBoundingClientRect();
  const tableRect = domNode.getBoundingClientRect();

  return {
    top: tableRect.top - containerRect.top + scrollContainer.scrollTop,
    left: tableRect.left - containerRect.left,
    width: tableRect.width,
    height: tableRect.height,
    rowCount,
    colCount,
  };
}

function TableEdgeControls({
  editor,
  scrollContainerRef,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState<TablePos | null>(null);

  useEffect(() => {
    const update = () => {
      const container = scrollContainerRef.current;
      if (!container || !editor.isActive('table')) {
        setPos(null);
        return;
      }
      setPos(measureTable(editor, container));
    };
    editor.on('selectionUpdate', update);
    editor.on('update', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('update', update);
    };
  }, [editor, scrollContainerRef]);

  if (!pos) return null;

  const canDeleteRow = pos.rowCount > 1;
  const canDeleteCol = pos.colCount > 1;

  const pill =
    'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors border border-black/[0.08]';
  const active = pill + ' bg-white/70 text-gray-700 hover:bg-white/90';
  const disabled = pill + ' cursor-not-allowed opacity-30 bg-white/40 text-gray-500';

  /* Row controls — centred below the table */
  const rowTop = pos.top + pos.height + 6;
  const rowLeft = pos.left + pos.width / 2;

  /* Column controls — centred to the right of the table */
  const colTop = pos.top + pos.height / 2;
  const colLeft = pos.left + pos.width + 6;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Below the table */}
      <div
        className="pointer-events-auto absolute flex items-center gap-1 rounded-lg border border-black/[0.08] bg-white/80 px-2 py-1 shadow-sm backdrop-blur-sm"
        style={{ top: rowTop, left: rowLeft, transform: 'translateX(-50%)' }}
      >
        <button
          type="button"
          title="Add row below"
          className={active}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().addRowAfter().run(); }}
        >
          <Plus size={10} /><span>row</span>
        </button>
        <span className="h-3 w-px bg-black/10" />
        <button
          type="button"
          title="Delete row"
          disabled={!canDeleteRow}
          className={canDeleteRow ? active : disabled}
          onMouseDown={(e) => { e.preventDefault(); if (canDeleteRow) editor.chain().deleteRow().run(); }}
        >
          <Minus size={10} /><span>row</span>
        </button>
      </div>

      {/* Right of the table */}
      <div
        className="pointer-events-auto absolute flex flex-col items-center gap-1 rounded-lg border border-black/[0.08] bg-white/80 px-1 py-2 shadow-sm backdrop-blur-sm"
        style={{ top: colTop, left: colLeft, transform: 'translateY(-50%)' }}
      >
        <button
          type="button"
          title="Add column after"
          className={active}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().addColumnAfter().run(); }}
        >
          <Plus size={10} /><span>col</span>
        </button>
        <span className="h-px w-3 bg-black/10" />
        <button
          type="button"
          title="Delete column"
          disabled={!canDeleteCol}
          className={canDeleteCol ? active : disabled}
          onMouseDown={(e) => { e.preventDefault(); if (canDeleteCol) editor.chain().deleteColumn().run(); }}
        >
          <Minus size={10} /><span>col</span>
        </button>
      </div>
    </div>
  );
}

export function NoteEditor() {
  const { activeItemId } = useAppStore();
  const { folders, updateNoteContent, updateNoteTitle } = useNotebook();
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [meta, setMeta] = useState<Pick<Note, 'folderId' | 'createdAt'> | null>(null);
  const activeItemIdRef = useRef(activeItemId);
  const updateNoteContentRef = useRef(updateNoteContent);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const lastTabAtRef = useRef(0);
  const { schedule, flush } = useAutoSave();
  const { doubleTabTableMacro } = useMacros();
  const isDoubleTabTableEnabledRef = useRef(doubleTabTableMacro.enabled);

  useEffect(() => {
    isDoubleTabTableEnabledRef.current = doubleTabTableMacro.enabled;
  }, [doubleTabTableMacro.enabled]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ResizableImage.configure({ inline: false }),
      ResizableCodeBlock,
      Link.configure({ autolink: true, openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start typing your knowledge...' }),
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: false }),
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class: 'tiptap-editor min-h-[300px] focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key !== 'Tab') {
          lastTabAtRef.current = 0;
          return false;
        }

        if (!isDoubleTabTableEnabledRef.current) {
          return false;
        }

        const { state } = view;
        const { selection } = state;
        const { $anchor, empty } = selection;
        const isEmptyParagraph =
          empty &&
          $anchor.parent.type.name === 'paragraph' &&
          $anchor.parent.content.size === 0;
        const isInsideBlockedNode = Array.from({ length: $anchor.depth + 1 }).some(
          (_, index) => {
            const nodeName = $anchor.node(index).type.name;
            return nodeName === 'table' || nodeName === 'tableCell' || nodeName === 'codeBlock';
          },
        );

        if (!isEmptyParagraph || isInsideBlockedNode) {
          lastTabAtRef.current = 0;
          return false;
        }

        event.preventDefault();

        const now = Date.now();
        const isDoublePress = now - lastTabAtRef.current <= 400;
        lastTabAtRef.current = now;

        if (!isDoublePress) {
          return true;
        }

        const cell = state.schema.nodes.tableHeader.createAndFill();
        if (!cell) {
          return true;
        }

        lastTabAtRef.current = 0;
        const row = state.schema.nodes.tableRow.create(null, cell);
        const table = state.schema.nodes.table.create(null, row);
        view.dispatch(state.tr.replaceWith($anchor.before(), $anchor.after(), table).scrollIntoView());
        return true;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    activeItemIdRef.current = activeItemId;
  }, [activeItemId]);

  useEffect(() => {
    updateNoteContentRef.current = updateNoteContent;
  }, [updateNoteContent]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleUpdate = () => {
      const id = activeItemIdRef.current;
      const content = editor.getJSON();
      const nextWordCount = getWordCount(editor.storage.characterCount);

      setWordCount(nextWordCount);
      schedule(async () => {
        if (!id) {
          return;
        }

        await updateNoteContentRef.current(id, content, nextWordCount);
      });
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, schedule]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    void flush();

    if (!activeItemId) {
      editor.commands.setContent(EMPTY_DOC, { emitUpdate: false });
      setTitle('');
      setMeta(null);
      setWordCount(0);
      return;
    }

    let cancelled = false;

    void db.notes.get(activeItemId).then((note) => {
      if (cancelled || !note) {
        return;
      }

      editor.commands.setContent(parseNoteContent(note.content), { emitUpdate: false });
      setTitle(note.title);
      setMeta({ folderId: note.folderId, createdAt: note.createdAt });
      setWordCount(note.wordCount ?? getWordCount(editor.storage.characterCount));
    });

    return () => {
      cancelled = true;
    };
  }, [activeItemId, editor, flush]);

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  if (!activeItemId) {
    return <EmptyState />;
  }

  const folder = meta?.folderId ? folders.find((item) => item.id === meta.folderId) : null;
  const date = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar editor={editor} />

      <div className="flex-shrink-0 border-b border-white/10 px-8 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          {folder && (
            <>
              <Folder size={11} className="flex-shrink-0" />
              <span>{folder.name}</span>
              <span>.</span>
            </>
          )}
          {date && <span>{date}</span>}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (activeItemId) {
              void updateNoteTitle(activeItemId, title);
            }
          }}
          placeholder="Untitled Note"
          className="w-full border-none bg-transparent text-[22px] font-bold leading-tight text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>

      <div ref={editorBodyRef} className="no-scrollbar relative flex-1 overflow-y-auto px-8 py-6">
        {editor && <EditorBubbleMenu editor={editor} />}
        {editor && <BlockInsertMenu editor={editor} />}
        {editor && <TableEdgeControls editor={editor} scrollContainerRef={editorBodyRef} />}
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-shrink-0 items-center justify-end border-t border-white/10 px-8 py-2">
        <span className="text-xs text-gray-400">{wordCount} words</span>
      </div>
    </div>
  );
}

function EditorBubbleMenu({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: currentEditor, from, to }) => from !== to && currentEditor.isEditable}
    >
      <div
        className="flex items-center gap-1 rounded-[10px] p-1.5"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        <BubbleButton
          title="Bold"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={13} />
        </BubbleButton>
        <BubbleButton
          title="Italic"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={13} />
        </BubbleButton>
        <BubbleButton
          title="Underline"
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={13} />
        </BubbleButton>
        <span className="mx-1 h-4 w-px bg-black/10" />
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.name}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleHighlight({ color: color.value }).run();
            }}
            className={cn(
              'h-5 w-5 rounded-full border border-black/10',
              editor.isActive('highlight', { color: color.value }) &&
                'ring-2 ring-gray-700 ring-offset-1',
            )}
            style={{ backgroundColor: color.value }}
          />
        ))}
        <button
          type="button"
          title="Clear highlight"
          onMouseDown={(event) => {
            event.preventDefault();
            editor.chain().focus().unsetHighlight().run();
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-gray-500"
        >
          <X size={11} />
        </button>
      </div>
    </BubbleMenu>
  );
}

function BubbleButton({
  title,
  isActive,
  onClick,
  children,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-white/50',
        isActive && 'bg-white/80 text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.07)]',
      )}
    >
      {children}
    </button>
  );
}
