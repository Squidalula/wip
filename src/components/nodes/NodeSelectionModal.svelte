<script lang="ts">
	import { X, Bot, MessageSquare, Plus, Search } from 'lucide-svelte';

	// Node categories for your automation workflow
	const nodeCategories = [
		{
			name: 'AI',
			description: 'AI-powered processing',
			nodes: [
				{
					id: 'llm',
					name: 'LLM Node',
					description: 'Send prompts to backend AI endpoint and receive responses',
					icon: Bot,
					color: 'bg-purple-500'
				}
			]
		},
		{
			name: 'JIRA',
			description: 'JIRA integration',
			nodes: [
				{
					id: 'jira-create-story',
					name: 'Create Story',
					description: 'Create a new JIRA story/issue',
					icon: Plus,
					color: 'bg-blue-500'
				},
				{
					id: 'jira-add-comment',
					name: 'Add Comment',
					description: 'Add a comment to an existing JIRA story',
					icon: MessageSquare,
					color: 'bg-green-500'
				},
				{
					id: 'get-jira-story',
					name: 'Get Story',
					description: 'Retrieve details of an existing JIRA story',
					icon: Search,
					color: 'bg-blue-600'
				}
			]
		}
	];

	export class NodeSelectionController {
		isOpen = $state(false);
		selectedCategory = $state(0);
		searchTerm = $state('');

		open() {
			this.isOpen = true;
		}

		close() {
			this.isOpen = false;
			this.searchTerm = '';
			this.selectedCategory = 0;
		}

		selectNode(nodeId: string) {
			console.log('Selected node:', nodeId);
			// Will emit to parent to add node to canvas
			this.close();
		}

		// Filter nodes based on search
		get filteredCategories() {
			if (!this.searchTerm) return nodeCategories;

			return nodeCategories
				.map((category) => ({
					...category,
					nodes: category.nodes.filter(
						(node) =>
							node.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
							node.description.toLowerCase().includes(this.searchTerm.toLowerCase())
					)
				}))
				.filter((category) => category.nodes.length > 0);
		}
	}

	// Props
	const {
		isOpen = false,
		onNodeSelect = () => {},
		onClose = () => {}
	}: {
		isOpen?: boolean;
		onNodeSelect?: (nodeId: string) => void;
		onClose?: () => void;
	} = $props();

	const controller = new NodeSelectionController();

	// Sync external state
	$effect(() => {
		if (isOpen) {
			controller.open();
		} else {
			controller.close();
		}
	});

	function handleNodeSelect(nodeId: string) {
		controller.selectNode(nodeId);
		onNodeSelect(nodeId);
	}

	function handleClose() {
		controller.close();
		onClose();
	}

	// Close on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if controller.isOpen}
	<!-- Modal Backdrop -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
		tabindex="-1"
		role="button"
		aria-label="Close modal"
	>
		<!-- Modal Content -->
		<div
			class="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl bg-base-100 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-base-300 p-6">
				<div>
					<h2 id="modal-title" class="text-2xl font-bold text-base-content">Add Node</h2>
					<p class="mt-1 text-base-content/60">Choose a node to add to your automation</p>
				</div>
				<button
					class="btn btn-circle cursor-pointer btn-ghost"
					onclick={handleClose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Search -->
			<div class="border-b border-base-300 p-6">
				<label for="node-search" class="sr-only">Search nodes</label>
				<input
					id="node-search"
					type="text"
					placeholder="Search nodes..."
					class="input-bordered input w-full"
					bind:value={controller.searchTerm}
				/>
			</div>

			<!-- Content -->
			<div class="flex h-96">
				<!-- Categories Sidebar -->
				<div class="w-64 overflow-y-auto border-r border-base-300 p-4">
					<h3 class="mb-4 font-semibold text-base-content">Categories</h3>
					{#each controller.filteredCategories as category, index}
						<button
							class="w-full cursor-pointer rounded-lg p-3 text-left transition-colors duration-150 {controller.selectedCategory ===
							index
								? 'bg-primary text-primary-content'
								: 'hover:bg-base-200'}"
							onclick={() => (controller.selectedCategory = index)}
						>
							<div class="font-medium">{category.name}</div>
							<div class="mt-1 text-xs opacity-70">{category.description}</div>
						</button>
					{/each}
				</div>

				<!-- Nodes Grid -->
				<div class="flex-1 overflow-y-auto p-6">
					{#if controller.filteredCategories.length > 0}
						{@const selectedCat = controller.filteredCategories[controller.selectedCategory]}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each selectedCat.nodes as node}
								<button
									class="cursor-pointer rounded-lg border border-base-300 p-4 text-left transition-all duration-200 hover:border-primary hover:shadow-md"
									onclick={() => handleNodeSelect(node.id)}
								>
									<div class="mb-3 flex items-center gap-3">
										<div class="h-10 w-10 {node.color} flex items-center justify-center rounded-lg">
											<node.icon size={20} class="text-white" />
										</div>
										<div>
											<div class="font-semibold text-base-content">{node.name}</div>
										</div>
									</div>
									<p class="text-sm text-base-content/70">{node.description}</p>
								</button>
							{/each}
						</div>
					{:else}
						<div class="flex h-full items-center justify-center">
							<div class="text-center">
								<div class="mb-2 text-lg text-base-content/40">No nodes found</div>
								<p class="text-base-content/60">Try a different search term</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
