<script lang="ts">
  import type { NodeViewProps } from '@tiptap/core';
  import cx from 'clsx';
  import { NodeViewWrapper } from '$lib';

  export let node: NodeViewProps['node'];
  export let updateAttributes: NodeViewProps['updateAttributes'];
  export let selected: NodeViewProps['selected'] = false;

  const handleClick = (): void => {
    updateAttributes({ count: node.attrs.count + 1 });
  };
</script>

<NodeViewWrapper
  id="svelte-component"
  class={cx('bg-yellow-200/90 border-black border-2 px-4 pb-4 rounded-md flex flex-col my-4', {
    'border-green-500': selected,
    selected,
  })}
  data-drag-handle=""
>
  <span class="bg-black py-1 px-3 text-white rounded-b-md uppercase text-[0.6rem] font-bold w-max"
    >Svelte Component</span
  >

  <div class="mt-4">
    <button
      id="counter-button"
      class="bg-gray-200 border-black border rounded px-1"
      on:click={handleClick}
      type="button"
    >
      This button has been clicked {node.attrs.count} times.
    </button>
  </div>
</NodeViewWrapper>
