import type { SvelteComponent } from 'svelte';
import type { SvelteNodeViewProps } from './SvelteNodeViewRenderer';

interface RendererOptions {
  element: HTMLElement;
}

class SvelteRenderer {
  component: SvelteComponent;

  dom: HTMLElement;

  constructor(component: SvelteComponent, { element }: RendererOptions) {
    this.component = component;
    this.dom = element;
    this.dom.classList.add('svelte-renderer');
  }

  updateProps(props: Partial<SvelteNodeViewProps>): void {
    this.component.$set(props);
  }

  destroy(): void {
    this.component.$destroy();
  }
}

export default SvelteRenderer;
