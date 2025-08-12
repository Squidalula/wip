<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { NodeData, type AutomationNode } from '../../lib/stores/nodes';
	import { themeManager } from '../../lib/stores/theme.svelte';
	import { toastStore } from '../../lib/stores/toast.svelte';
	import NodeModal from '../nodes/DynamicNodeModal.svelte';
	import ResultsPanelLayout from '../ui/ResultsPanelLayout.svelte';
	import { getNodeSchema } from '../../lib/types/node-schemas';
	import { flowService } from '../../lib/services/FlowService';
	import { flowExecutor } from '../../lib/services/FlowExecutor';
	import type { FlowExecutionResult, ExecutionResult } from '../../lib/types/automation';

	let flowLoaded = $state(false);
	let SvelteFlow = $state<any>(null);
	let Controls = $state<any>(null);
	let Background = $state<any>(null);

		export class FlowEditor {
		nodes: any[] = $state([]);
		edges: any[] = $state([]);
		currentFlowId: string | null = $state(null);

		// Update node selection state for visual feedback
		get nodesWithSelection() {
			return this.nodes.map(node => ({
				...node,
				selected: node.id === this.selectedNodeForDeletion?.id
			}));
		}

		
		isModalOpen = $state(false);
		selectedNode = $state<AutomationNode | null>(null);
		modalPosition = $state({ x: 0, y: 0 });
		
		selectedNodeForResults = $state<AutomationNode | null>(null);
		
		// Track selected node for keyboard deletion
		selectedNodeForDeletion = $state<AutomationNode | null>(null);
		
		isPanelCollapsed = $state(false);
		
		isExecuting = $state(false);
		lastExecutionResult = $state<FlowExecutionResult | null>(null);

		addNode() {
			const newId = String(this.nodes.length + 1);
			const newNode = NodeData.createNewNode(newId);
			this.nodes = [...this.nodes, newNode];
		}

		addAutomationNode(category: string) {
			const newId = `node_${Date.now()}`;


			let nodeType: 'trigger' | 'action' | 'logic' | 'code' = 'action';
			if (['webhook', 'schedule', 'manual'].includes(category)) {
				nodeType = 'trigger';
			} else if (['if', 'filter', 'loop'].includes(category)) {
				nodeType = 'logic';
			} else if (category === 'javascript') {
				nodeType = 'code';
			} else if (['llm', 'jira-create-story', 'jira-add-comment', 'get-jira-story'].includes(category)) {
				nodeType = 'action';
			}

			const newNode = NodeData.createAutomationNode(newId, nodeType, category);
			this.nodes = [...this.nodes, newNode];

			console.log('Added automation node:', newNode);
			setTimeout(() => this.updateNodeValidation(), 100);
		}

		onNodeClick({ node, event }: { node: any; event: MouseEvent | TouchEvent }) {
			console.log('Node clicked:', node);
			this.selectedNodeForResults = node;
			// Track selected node for keyboard deletion
			this.selectedNodeForDeletion = node;

			// Open modal for configurable nodes (single-click behavior)
			if (
				node.category === 'llm' ||
				node.category === 'jira-create-story' ||
				node.category === 'jira-add-comment' ||
				node.category === 'get-jira-story'
			) {
				this.selectedNode = node;
				if ('clientX' in event && 'clientY' in event) {
					this.modalPosition = { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
				} else {
					this.modalPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
				}
				this.isModalOpen = true;
				onConfigModalStateChange?.(true);
			}
		}

		saveNodeConfig(nodeId: string, config: any) {
			const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
			if (nodeIndex !== -1) {

				const updatedNode = {
					...this.nodes[nodeIndex],
					data: {
						...this.nodes[nodeIndex].data,
						config: config
					}
				};


				this.nodes = [
					...this.nodes.slice(0, nodeIndex),
					updatedNode,
					...this.nodes.slice(nodeIndex + 1)
				];

							console.log('Node configuration saved:', nodeId, config);
			console.log('Updated node:', updatedNode);
			toastStore.success('Configuration saved', `Node settings have been updated`);
			this.updateNodeValidation();
			}
		}

		updateNodePosition(nodeId: string, position: { x: number; y: number }) {
			const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
			if (nodeIndex !== -1) {
				
				this.nodes[nodeIndex].position = position;
				console.log('Node position updated:', nodeId, position);
			}
		}


		validateNode(node: AutomationNode): boolean {
			const schema = getNodeSchema(node.category);
			if (!schema) return true;

			const config = node.data.config || {};


			return schema.fields.every((field) => {
				if (!field.required) return true;
				const value = config[field.id];
				return value !== undefined && value !== null && value !== '';
			});
		}


		updateNodeValidation() {
			let hasChanges = false;
			const updatedNodes = this.nodes.map((node) => {
				const isValid = this.validateNode(node);
				const baseStyle = this.getBaseNodeStyle(node);

				const currentStyle = node.style || '';
				const hasValidationStyling = currentStyle.includes('#ef4444');


				let newStyle: string;
				if (isValid) {
					newStyle = baseStyle;
				} else {
					newStyle =
						baseStyle +
						' border: 2px solid #ef4444 !important; box-shadow: 0 0 0 1px #ef4444, 0 2px 4px rgba(239, 68, 68, 0.2) !important;';
				}


				if (currentStyle !== newStyle) {
					hasChanges = true;
					return {
						...node,
						style: newStyle
					};
				}


				return node;
			});


			if (hasChanges) {
				this.nodes = updatedNodes;
			}
		}


		getBaseNodeStyle(node: AutomationNode): string {

			const originalStyle = node.style || '';

			return originalStyle
				.replace(/border: 2px solid #ef4444[^;]*;/g, '')
				.replace(/border: 3px solid #ef4444[^;]*;/g, '')
				.replace(/box-shadow: 0 0 0 1px #ef4444[^;]*;/g, '')
				.trim();
		}

		deleteNode(nodeId: string) {

			this.nodes = this.nodes.filter((node) => node.id !== nodeId);

			this.edges = this.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
			
			// Clear selections if the deleted node was selected
			if (this.selectedNodeForDeletion?.id === nodeId) {
				this.selectedNodeForDeletion = null;
			}
			if (this.selectedNodeForResults?.id === nodeId) {
				this.selectedNodeForResults = null;
			}
			if (this.selectedNode?.id === nodeId) {
				this.selectedNode = null;
			}
			
			console.log('Node deleted:', nodeId);
			toastStore.warning('Node deleted', 'Node and its connections have been removed');
		}

		// Handle keyboard deletion
		handleKeyboardDelete() {
			if (this.selectedNodeForDeletion && !this.isModalOpen) {
				this.deleteNode(this.selectedNodeForDeletion.id);
			}
		}

		// Clear node selection when clicking on empty space
		clearSelection() {
			this.selectedNodeForDeletion = null;
		}

		closeModal() {
			this.isModalOpen = false;
			this.selectedNode = null;
			onConfigModalStateChange?.(false);
		}

		onEdgeClick({ edge, event }: { edge: any; event: MouseEvent }) {
			console.log('Edge clicked:', edge);
		}


		async initializeFlow(flowId: string = 'empty') {
			try {
				const flow = await flowService.getFlow(flowId);
				if (flow) {
					this.nodes = [...flow.nodes];
					this.edges = [...flow.edges];
					this.currentFlowId = flow.id;
					console.log('Flow loaded:', flow.name);
				} else {

					this.nodes = [];
					this.edges = [];
					this.currentFlowId = null;
				}

				setTimeout(() => this.updateNodeValidation(), 100);
			} catch (error) {
				console.error('Failed to load flow:', error);

				this.nodes = NodeData.getInitialNodes();
				this.edges = NodeData.getInitialEdges();
				this.currentFlowId = null;
			}
		}


		async loadFlow(flowId: string) {
			await this.initializeFlow(flowId);
		}


		async saveCurrentFlow(name: string, description?: string) {
			try {
				if (this.currentFlowId) {

					const updated = await flowService.updateFlow(this.currentFlowId, {
						name,
						description,
						nodes: this.nodes,
						edges: this.edges
					});
					console.log('Flow updated:', updated.name);
					return updated;
				} else {

					const saved = await flowService.saveFlow({
						name,
						description,
						nodes: this.nodes,
						edges: this.edges
					});
					this.currentFlowId = saved.id;
					console.log('Flow saved:', saved.name);
					return saved;
				}
			} catch (error) {
				console.error('Failed to save flow:', error);
				throw error;
			}
		}


		getSelectedNodeResult(): ExecutionResult | null {
			if (!this.selectedNodeForResults || !this.lastExecutionResult) {
				return null;
			}
			
			return this.lastExecutionResult.results.find(
				result => result.nodeId === this.selectedNodeForResults!.id
			) || null;
		}


		clearExecutionResults() {
			this.lastExecutionResult = null;
			console.log('Execution results cleared');
		}


		handlePanelCollapseChange(isCollapsed: boolean) {
			this.isPanelCollapsed = isCollapsed;
		}


		toggleResultsPanel() {
			this.isPanelCollapsed = !this.isPanelCollapsed;

			this.handlePanelCollapseChange(this.isPanelCollapsed);
		}


		async executeCurrentFlow() {
			if (this.isExecuting) {
				console.warn('Flow execution already in progress');
				return;
			}
			
			if (this.nodes.length === 0) {
				console.warn('No nodes to execute');
				return;
			}
			
			this.isExecuting = true;
			this.lastExecutionResult = null;
			
			try {

				const flowData = {
					id: this.currentFlowId || 'temp-flow',
					name: 'Current Flow',
					nodes: this.nodes,
					edges: this.edges
				};
				
				console.log('🚀 Executing flow:', flowData.name);
				

				const result = await flowExecutor.executeFlow(flowData);
				this.lastExecutionResult = result;
				
				console.log('✅ Flow execution completed:', {
					success: result.success,
					duration: `${result.totalDuration}ms`,
					order: result.executionOrder
				});
				

				result.results.forEach((nodeResult, index) => {
					const status = nodeResult.success ? '✅' : '❌';
					console.log(`${status} ${nodeResult.nodeId}: ${nodeResult.duration}ms`, nodeResult.output || nodeResult.error);
				});
				
				return result;
				
			} catch (error) {
				console.error('❌ Flow execution failed:', error);
				this.lastExecutionResult = {
					flowId: this.currentFlowId || 'temp-flow',
					success: false,
					results: [],
					totalDuration: 0,
					executionOrder: []
				};
				throw error;
			} finally {
				this.isExecuting = false;
			}
		}


		resetCanvas() {
			this.nodes = [];
			this.edges = [];
			this.currentFlowId = null;
			this.lastExecutionResult = null;
			
			// Clear all selections
			this.selectedNodeForDeletion = null;
			this.selectedNodeForResults = null;
			this.selectedNode = null;
			
			console.log('Canvas reset');

			setTimeout(() => this.updateNodeValidation(), 100);
		}
	}


const { onNodeAdd, onPanelStateChange, onConfigModalStateChange }: { 
    onNodeAdd?: (editor: FlowEditor) => void;
    onPanelStateChange?: (isCollapsed: boolean) => void;
    onConfigModalStateChange?: (isOpen: boolean) => void;
} = $props();

	const flowEditor = new FlowEditor();


	$effect(() => {
		if (onNodeAdd) {
			onNodeAdd(flowEditor);
		}
	});


	$effect(() => {
		if (onPanelStateChange) {
			onPanelStateChange(flowEditor.isPanelCollapsed);
		}
	});


	$effect(() => {
		if (flowLoaded) {
			flowEditor.initializeFlow();
		}
	});

	function handleNodeClick({ node, event }: { node: any; event: MouseEvent | TouchEvent }) {
		flowEditor.onNodeClick({ node, event });
	}

    // no-op: single-click opens modal now

	function handleEdgeClick({ edge, event }: { edge: any; event: MouseEvent }) {
		flowEditor.onEdgeClick({ edge, event });
	}

	function handleNodeDragStop({ targetNode }: { targetNode: any }) {
		if (targetNode) {
			flowEditor.updateNodePosition(targetNode.id, targetNode.position);
		}
	}

	// Handle keyboard events for deletion
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			flowEditor.handleKeyboardDelete();
		}
	}

	// Handle clicks on empty space to clear selection
	function handlePaneClick(event: MouseEvent) {
		// Only clear selection if clicking directly on the pane, not on nodes
		const target = event.target as HTMLElement;
		if (target.classList.contains('svelte-flow__pane') || 
			target.classList.contains('svelte-flow__renderer') ||
			target.closest('.svelte-flow__background')) {
			flowEditor.clearSelection();
		}
	}

	onMount(async () => {
		if (browser) {
			try {
				const module = await import('@xyflow/svelte');
				SvelteFlow = module.SvelteFlow;
				Controls = module.Controls;
				Background = module.Background;

				await import('@xyflow/svelte/dist/style.css');

				flowLoaded = true;
			} catch (error) {
				console.error('Failed to load @xyflow/svelte:', error);
			}
		}
	});


	const flowStyles = $derived({
		backgroundColor: themeManager.getCurrentThemeBackground(),
		color: themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000'
	});


	const backgroundProps = $derived({
		color: themeManager.isCurrentThemeDark() ? '#ffffff30' : '#00000030',
		size: 2,
		gap: 20
	});


	const flowThemeClass = $derived(themeManager.getCurrentFlowTheme() === 'dark' ? 'dark' : 'light');
</script>

<style>
	:global(.svelte-flow) {
		background: transparent !important;
	}

	:global(.svelte-flow__renderer) {
		background: transparent !important;
	}

	:global(.svelte-flow__viewport) {
		background: transparent !important;
	}

	:global(.react-flow__renderer) {
		background: transparent !important;
	}

	:global(.react-flow__viewport) {
		background: transparent !important;
	}

	:global(.flow-theme-dark .svelte-flow .react-flow__controls) {
		background-color: rgba(0, 0, 0, 0.8);
		border-color: rgba(255, 255, 255, 0.2);
	}

	:global(.flow-theme-dark .svelte-flow .react-flow__controls button) {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border-color: rgba(255, 255, 255, 0.2);
	}

	:global(.flow-theme-dark .svelte-flow .react-flow__controls button:hover) {
		background-color: rgba(255, 255, 255, 0.2);
	}

	:global(.flow-theme-light .svelte-flow .react-flow__controls) {
		background-color: rgba(255, 255, 255, 0.9);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.flow-theme-light .svelte-flow .react-flow__controls button) {
		background-color: white;
		color: #374151;
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.flow-theme-light .svelte-flow .react-flow__controls button:hover) {
		background-color: #f3f4f6;
	}

	:global(.svelte-flow .react-flow__node) {
		cursor: pointer !important;
	}

	:global(.svelte-flow .react-flow__edge) {
		cursor: pointer !important;
	}

	:global(.svelte-flow .react-flow__controls button) {
		cursor: pointer !important;
	}

	/* Node interaction styling */
    :global(.svelte-flow__node) {
        cursor: pointer !important;
    }

	/* Selected node styling */
	:global(.svelte-flow__node.selected) {
		outline: 2px solid #3b82f6 !important;
		outline-offset: 2px;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
	}
	
	:global(.svelte-flow__node.selected .node-content) {
		border-color: #3b82f6 !important;
	}

    /* remove selected:hover transforms to avoid layout jitter */
</style>

<!-- Global keyboard event listener -->
<svelte:window onkeydown={handleKeydown} />

{#if browser && flowLoaded && SvelteFlow}
	<div class="flex h-full w-full">

        <div
            class="flex-1 transition-colors duration-300 flow-theme-{flowThemeClass} overflow-hidden"
            style="background-color: {flowStyles.backgroundColor}; color: {flowStyles.color};"
        >
			<SvelteFlow
				nodes={flowEditor.nodesWithSelection}
				edges={flowEditor.edges}
				onnodeclick={handleNodeClick}
				onedgeclick={handleEdgeClick}
				onnodedragstop={handleNodeDragStop}
				onpaneclick={handlePaneClick}
			>
				<Background
					variant="dots"
					color={backgroundProps.color}
					size={backgroundProps.size}
					gap={backgroundProps.gap}
				/>
			</SvelteFlow>
		</div>


        <ResultsPanelLayout
			selectedNode={flowEditor.selectedNodeForResults}
			selectedNodeResult={flowEditor.getSelectedNodeResult()}
			flowExecutionResult={flowEditor.lastExecutionResult}
			isExecuting={flowEditor.isExecuting}
			onClearResults={() => flowEditor.clearExecutionResults()}
			onCollapseChange={(isCollapsed) => flowEditor.handlePanelCollapseChange(isCollapsed)}
            isCollapsedExternal={flowEditor.isPanelCollapsed}
        />
	</div>
{:else}
	<div
		class="flex h-full w-full items-center justify-center transition-colors duration-300"
		style="background-color: {themeManager.getCurrentThemeBackground()}"
	>
		<div class={themeManager.isCurrentThemeDark() ? 'text-gray-300' : 'text-gray-600'}>
			{#if browser}
				Loading...
			{:else}
				Initializing
			{/if}
		</div>
	</div>
{/if}


<NodeModal
	isOpen={flowEditor.isModalOpen}
	node={flowEditor.selectedNode}
	position={flowEditor.modalPosition}
	onClose={() => flowEditor.closeModal()}
	onSave={(nodeId, config) => flowEditor.saveNodeConfig(nodeId, config)}
	onDelete={(nodeId) => flowEditor.deleteNode(nodeId)}
/>


