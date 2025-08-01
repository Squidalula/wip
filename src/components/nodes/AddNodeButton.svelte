<script lang="ts">
	import { Plus } from 'lucide-svelte';

	// Props using Svelte 5 runes
	const { onAddClick = () => {}, isPanelCollapsed = false }: { 
		onAddClick?: () => void;
		isPanelCollapsed?: boolean;
	} = $props();
</script>

<button
	class="group btn fixed bottom-6 z-40 btn-circle cursor-pointer shadow-xl transition-all duration-300 btn-lg btn-primary hover:shadow-2xl"
	style="right: {isPanelCollapsed ? '24px' : '408px'};"
	onclick={() => onAddClick()}
	aria-label="Add automation node"
>
	<Plus size={28} class="transition-transform duration-200 group-hover:rotate-90" />
</button>
