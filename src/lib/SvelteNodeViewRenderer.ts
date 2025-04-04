import { NodeView, Editor, type DecorationWithType, type EditorEvents } from '@tiptap/core';
import type { NodeViewRenderer, NodeViewProps, NodeViewRendererOptions } from '@tiptap/core';
import type { Decoration } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { type SvelteComponent } from 'svelte';

import SvelteRenderer from './SvelteRenderer';
import { TIPTAP_NODE_VIEW } from './context';
import { tree } from './createEditor';

interface RendererUpdateProps {
  oldNode: ProseMirrorNode;
  oldDecorations: Decoration[];
  newNode: ProseMirrorNode;
  newDecorations: Decoration[];
  updateProps: () => void;
}

export interface SvelteNodeViewRendererOptions extends NodeViewRendererOptions {
  update: ((props: RendererUpdateProps) => boolean) | null;
  as?: string;
  contentDOMElementTag?: string;
}

export interface SvelteNodeViewProps extends NodeViewProps {
  isEditable: boolean;
}

type SvelteComponentRaw = typeof SvelteComponent<Partial<SvelteNodeViewProps>>;

class SvelteNodeView extends NodeView<SvelteComponentRaw, Editor, SvelteNodeViewRendererOptions> {
  renderer!: SvelteRenderer;
  contentDOMElement!: HTMLElement | null;
  isEditable = false;

  override mount(): void {
    const Component = this.component;
    this.isEditable = this.editor?.isEditable;

    const props: SvelteNodeViewProps = {
      editor: this.editor,
      node: this.node,
      decorations: this.decorations,
      selected: false,
      isEditable: this.isEditable,
      extension: this.extension,
      getPos: () => this.getPos(),
      updateAttributes: (attributes = {}) => this.updateAttributes(attributes),
      deleteNode: () => this.deleteNode(),
    };

    if (this.node.isLeaf) {
      this.contentDOMElement = null;
    } else if (this.options.contentDOMElementTag) {
      this.contentDOMElement = document.createElement(this.options.contentDOMElementTag);
    } else {
      this.contentDOMElement = document.createElement(this.node.isInline ? 'span' : 'div');
    }
    // this.contentOMElement = this.node.isLeaf ? null : document.createElement(this.node.isInline ? 'span' : 'div');

    if (this.contentDOMElement) {
      // For some reason the whiteSpace prop is not inherited properly in Chrome and Safari
      // With this fix it seems to work fine
      // See: https://github.com/ueberdosis/tiptap/issues/1197
      this.contentDOMElement.style.whiteSpace = 'inherit';
    }

    const context = new Map(tree.context);
    context.set(TIPTAP_NODE_VIEW, {
      onDragStart: this.onDragStart.bind(this),
    });

    const as = this.options.as ?? (this.node.isInline ? 'span' : 'div');
    const target = document.createElement(as);
    target.classList.add(`node-${this.node.type.name}`);

    this.handleSelectionUpdate = this.handleSelectionUpdate.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.editor.on('selectionUpdate', this.handleSelectionUpdate);
    this.editor.on('update', this.handleUpdate);
    const svelteComponent: SvelteComponent = new Component({
      target,
      props,
      context,
    });

    this.renderer = new SvelteRenderer(svelteComponent, {
      element: target,
    });

    this.appendContendDom();
  }

  private appendContendDom() {
    const contentElement = this.dom.querySelector('[data-node-view-content]');

    if (this.contentDOMElement && contentElement && !contentElement.contains(this.contentDOMElement)) {
      contentElement.appendChild(this.contentDOMElement);
    }
  }

  override get dom() {
    if (!this.renderer.dom.firstElementChild?.hasAttribute('data-node-view-wrapper')) {
      throw Error('Please use the NodeViewWrapper component for your node view.');
    }

    return this.renderer.dom;
  }

  override get contentDOM() {
    if (this.node.isLeaf) {
      return null;
    }

    return this.contentDOMElement;
  }

  handleUpdate({ editor }: EditorEvents['update']) {
    // propagate isEditable only if editable state has changed
    if (this.isEditable !== editor?.isEditable) {
      this.isEditable = editor?.isEditable;
      this.renderer.updateProps({ isEditable: this.isEditable });
    }
  }

  handleSelectionUpdate() {
    const { from, to } = this.editor.state.selection;

    if (from <= this.getPos() && to >= this.getPos() + this.node.nodeSize) {
      this.selectNode();
    } else {
      this.deselectNode();
    }
  }

  update(node: ProseMirrorNode, decorations: DecorationWithType[]): boolean {
    const updateProps = () => {
      this.renderer.updateProps({ node, decorations });
    };

    if (typeof this.options.update === 'function') {
      const oldNode = this.node;
      const oldDecorations = this.decorations;

      this.node = node;
      this.decorations = decorations;

      return this.options.update({
        oldNode,
        oldDecorations,
        newNode: node,
        newDecorations: decorations,
        updateProps: () => updateProps(),
      });
    }

    if (node.type !== this.node.type) {
      return false;
    }

    if (node === this.node && this.decorations === decorations) {
      return true;
    }

    this.node = node;
    this.decorations = decorations;
    updateProps();

    return true;
  }

  selectNode(): void {
    this.renderer.updateProps({ selected: true });
  }

  deselectNode(): void {
    this.renderer.updateProps({ selected: false });
  }

  destroy(): void {
    this.renderer.destroy();
    this.editor.off('selectionUpdate', this.handleSelectionUpdate);
    this.editor.off('update', this.handleUpdate);
    this.contentDOMElement = null;
  }
}

const SvelteNodeViewRenderer = (
  component: SvelteComponentRaw,
  options?: Partial<SvelteNodeViewRendererOptions>,
): NodeViewRenderer => {
  return (props): SvelteNodeView => new SvelteNodeView(component, props, options);
};

export default SvelteNodeViewRenderer;
