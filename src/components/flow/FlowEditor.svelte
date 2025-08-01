<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { NodeData, type AutomationNode } from '../../lib/stores/nodes';
	import { themeManager } from '../../lib/stores/theme.svelte';
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

		// Modal state
		isModalOpen = $state(false);
		selectedNode = $state<AutomationNode | null>(null);
		modalPosition = $state({ x: 0, y: 0 });
		
		// Results viewing state
		selectedNodeForResults = $state<AutomationNode | null>(null);
		
		// Results panel state
		isPanelCollapsed = $state(false);
		
		// Execution state
		isExecuting = $state(false);
		lastExecutionResult = $state<FlowExecutionResult | null>(null);

		addNode() {
			const newId = String(this.nodes.length + 1);
			const newNode = NodeData.createNewNode(newId);
			this.nodes = [...this.nodes, newNode];
		}

		addAutomationNode(category: string) {
			const newId = `node_${Date.now()}`;

			// Determine node type based on category
			let nodeType: 'trigger' | 'action' | 'logic' | 'code' = 'action';
			if (['webhook', 'schedule', 'manual'].includes(category)) {
				nodeType = 'trigger';
			} else if (['if', 'filter', 'loop'].includes(category)) {
				nodeType = 'logic';
			} else if (category === 'javascript') {
				nodeType = 'code';
			} else if (['llm', 'jira-create-story', 'jira-add-comment'].includes(category)) {
				nodeType = 'action';
			}

			const newNode = NodeData.createAutomationNode(newId, nodeType, category);
			this.nodes = [...this.nodes, newNode];

			console.log('Added automation node:', newNode);

			// Trigger validation after adding new node
			setTimeout(() => this.updateNodeValidation(), 100);
		}

		onNodeClick({ node, event }: { node: any; event: MouseEvent | TouchEvent }) {
			console.log('Node clicked:', node);

			// Set selected node for results viewing
			this.selectedNodeForResults = node;

			// Open modal for configurable nodes (LLM and JIRA nodes)
			if (
				node.category === 'llm' ||
				node.category === 'jira-create-story' ||
				node.category === 'jira-add-comment'
			) {
				this.selectedNode = node;

				// Get mouse position for modal positioning
				if ('clientX' in event && 'clientY' in event) {
					this.modalPosition = { x: event.clientX, y: event.clientY };
				} else {
					// Default position for touch events
					this.modalPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
				}

				this.isModalOpen = true;
			}
		}

		saveNodeConfig(nodeId: string, config: any) {
			const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
			if (nodeIndex !== -1) {
				// Create a new array with the updated node to ensure reactivity
				const updatedNode = {
					...this.nodes[nodeIndex],
					data: {
						...this.nodes[nodeIndex].data,
						config: config
					}
				};

				// Replace the entire array to trigger reactivity
				this.nodes = [
					...this.nodes.slice(0, nodeIndex),
					updatedNode,
					...this.nodes.slice(nodeIndex + 1)
				];

				console.log('Node configuration saved:', nodeId, config);
				console.log('Updated node:', updatedNode);

				// Update node styling after config save
				this.updateNodeValidation();
			}
		}

		updateNodePosition(nodeId: string, position: { x: number; y: number }) {
			const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
			if (nodeIndex !== -1) {
				// Update the node position without triggering array replacement
				// This preserves the object reference for Svelte Flow position tracking
				this.nodes[nodeIndex].position = position;
				console.log('Node position updated:', nodeId, position);
			}
		}

		// Validate node configuration
		validateNode(node: AutomationNode): boolean {
			const schema = getNodeSchema(node.category);
			if (!schema) return true; // No schema = valid

			const config = node.data.config || {};

			// Check if all required fields are filled
			return schema.fields.every((field) => {
				if (!field.required) return true;
				const value = config[field.id];
				return value !== undefined && value !== null && value !== '';
			});
		}

		// Update node styles based on validation
		updateNodeValidation() {
			let hasChanges = false;
			const updatedNodes = this.nodes.map((node) => {
				const isValid = this.validateNode(node);
				const baseStyle = this.getBaseNodeStyle(node);

				const currentStyle = node.style || '';
				const hasValidationStyling = currentStyle.includes('#ef4444');

				// Determine what the new style should be
				let newStyle: string;
				if (isValid) {
					newStyle = baseStyle;
				} else {
					newStyle =
						baseStyle +
						' border: 2px solid #ef4444 !important; box-shadow: 0 0 0 1px #ef4444, 0 2px 4px rgba(239, 68, 68, 0.2) !important;';
				}

				// Only create a new object if the style actually needs to change
				if (currentStyle !== newStyle) {
					hasChanges = true;
					return {
						...node,
						style: newStyle
					};
				}

				// Return the same node object if no changes needed
				return node;
			});

			// Only update the nodes array if there were actual changes
			if (hasChanges) {
				this.nodes = updatedNodes;
			}
		}

		// Get base style for a node (without validation styling)
		getBaseNodeStyle(node: AutomationNode): string {
			// Use the original style from when the node was created, removing any validation styling
			const originalStyle = node.style || '';
			// Remove any existing validation styling
			return originalStyle
				.replace(/border: 2px solid #ef4444[^;]*;/g, '')
				.replace(/border: 3px solid #ef4444[^;]*;/g, '')
				.replace(/box-shadow: 0 0 0 1px #ef4444[^;]*;/g, '')
				.trim();
		}

		deleteNode(nodeId: string) {
			// Remove node
			this.nodes = this.nodes.filter((node) => node.id !== nodeId);
			// Remove connected edges
			this.edges = this.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
			console.log('Node deleted:', nodeId);
		}

		closeModal() {
			this.isModalOpen = false;
			this.selectedNode = null;
			// Don't update validation here - it interferes with position tracking
		}

		onEdgeClick({ edge, event }: { edge: any; event: MouseEvent }) {
			console.log('Edge clicked:', edge);
		}

		// Initialize with default flow
		async initializeFlow(flowId: string = 'empty') {
			try {
				const flow = await flowService.getFlow(flowId);
				if (flow) {
					this.nodes = [...flow.nodes];
					this.edges = [...flow.edges];
					this.currentFlowId = flow.id;
					console.log('Flow loaded:', flow.name);
				} else {
					// Fallback to empty flow
					this.nodes = [];
					this.edges = [];
					this.currentFlowId = null;
				}
				// Trigger validation after loading
				setTimeout(() => this.updateNodeValidation(), 100);
			} catch (error) {
				console.error('Failed to load flow:', error);
				// Fallback to backward compatibility
				this.nodes = NodeData.getInitialNodes();
				this.edges = NodeData.getInitialEdges();
				this.currentFlowId = null;
			}
		}

		// Load a specific flow
		async loadFlow(flowId: string) {
			await this.initializeFlow(flowId);
		}

		// Save current flow (only works when API is configured)
		async saveCurrentFlow(name: string, description?: string) {
			try {
				if (this.currentFlowId) {
					// Update existing flow
					const updated = await flowService.updateFlow(this.currentFlowId, {
						name,
						description,
						nodes: this.nodes,
						edges: this.edges
					});
					console.log('Flow updated:', updated.name);
					return updated;
				} else {
					// Create new flow
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

		// Get execution result for the selected node
		getSelectedNodeResult(): ExecutionResult | null {
			if (!this.selectedNodeForResults || !this.lastExecutionResult) {
				return null;
			}
			
			return this.lastExecutionResult.results.find(
				result => result.nodeId === this.selectedNodeForResults!.id
			) || null;
		}

		// Clear execution results
		clearExecutionResults() {
			this.lastExecutionResult = null;
			console.log('Execution results cleared');
		}

		// Handle panel collapse state change
		handlePanelCollapseChange(isCollapsed: boolean) {
			this.isPanelCollapsed = isCollapsed;
		}

		// Toggle results panel
		toggleResultsPanel() {
			this.isPanelCollapsed = !this.isPanelCollapsed;
			// Trigger the panel to update its state
			this.handlePanelCollapseChange(this.isPanelCollapsed);
		}

		// Execute current flow
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
				// Create flow data for execution
				const flowData = {
					id: this.currentFlowId || 'temp-flow',
					name: 'Current Flow',
					nodes: this.nodes,
					edges: this.edges
				};
				
				console.log('🚀 Executing flow:', flowData.name);
				
				// Execute the flow
				const result = await flowExecutor.executeFlow(flowData);
				this.lastExecutionResult = result;
				
				console.log('✅ Flow execution completed:', {
					success: result.success,
					duration: `${result.totalDuration}ms`,
					order: result.executionOrder
				});
				
				// Show execution results in console for now
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

		// Method to be called from parent when reset is clicked
		resetCanvas() {
			this.nodes = [];
			this.edges = [];
			this.currentFlowId = null;
			this.lastExecutionResult = null;
			console.log('Canvas reset');
			// Trigger validation after reset
			setTimeout(() => this.updateNodeValidation(), 100);
		}
	}

	// Props for external control
	const { onNodeAdd, onPanelStateChange }: { 
		onNodeAdd?: (editor: FlowEditor) => void;
		onPanelStateChange?: (isCollapsed: boolean) => void;
	} = $props();

	const flowEditor = new FlowEditor();

	// Expose flowEditor to parent via callback
	$effect(() => {
		if (onNodeAdd) {
			onNodeAdd(flowEditor);
		}
	});

	// Notify parent when panel state changes
	$effect(() => {
		if (onPanelStateChange) {
			onPanelStateChange(flowEditor.isPanelCollapsed);
		}
	});

	// Initialize flow and validation when component loads
	$effect(() => {
		if (flowLoaded) {
			flowEditor.initializeFlow();
		}
	});

	function handleNodeClick({ node, event }: { node: any; event: MouseEvent | TouchEvent }) {
		flowEditor.onNodeClick({ node, event });
	}

	function handleEdgeClick({ edge, event }: { edge: any; event: MouseEvent }) {
		flowEditor.onEdgeClick({ edge, event });
	}

	function handleNodeDragStop({ targetNode }: { targetNode: any }) {
		if (targetNode) {
			flowEditor.updateNodePosition(targetNode.id, targetNode.position);
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

	// Reactive styles based on current theme
	const flowStyles = $derived({
		backgroundColor: themeManager.getCurrentThemeBackground(),
		color: themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000'
	});

	// Dynamic background pattern color based on theme
	const backgroundProps = $derived({
		color: themeManager.isCurrentThemeDark() ? '#ffffff30' : '#00000030',
		size: 2,
		gap: 20
	});

	// Apply Svelte Flow theme class
	const flowThemeClass = $derived(themeManager.getCurrentFlowTheme() === 'dark' ? 'dark' : 'light');
</script>

{#if browser && flowLoaded && SvelteFlow}
	<div class="flex h-full w-full">
		<!-- Flow Editor Area -->
		<div
			class="flex-1 flow-container transition-colors duration-300 flow-theme-{flowThemeClass}"
			style="--flow-bg-color: {flowStyles.backgroundColor}; --flow-text-color: {flowStyles.color};"
		>
			<SvelteFlow
				nodes={flowEditor.nodes}
				edges={flowEditor.edges}
				onnodeclick={handleNodeClick}
				onedgeclick={handleEdgeClick}
				onnodedragstop={handleNodeDragStop}
			>
				<Background
					variant="dots"
					color={backgroundProps.color}
					size={backgroundProps.size}
					gap={backgroundProps.gap}
				/>
			</SvelteFlow>
		</div>

		<!-- Results Panel -->
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

<!-- Node Configuration Modal -->
<NodeModal
	isOpen={flowEditor.isModalOpen}
	node={flowEditor.selectedNode}
	position={flowEditor.modalPosition}
	onClose={() => flowEditor.closeModal()}
	onSave={(nodeId, config) => flowEditor.saveNodeConfig(nodeId, config)}
	onDelete={(nodeId) => flowEditor.deleteNode(nodeId)}
/>

<style>
	.flow-container {
		background-color: var(--flow-bg-color);
	}

	/* Allow background pattern to show through */
	:global(.flow-container .svelte-flow) {
		background: transparent !important;
	}

	:global(.flow-container .svelte-flow__renderer) {
		background: transparent !important;
	}

	:global(.flow-container .svelte-flow__viewport) {
		background: transparent !important;
	}

	:global(.flow-container .svelte-flow .react-flow__renderer) {
		background: transparent !important;
	}

	:global(.flow-container .svelte-flow .react-flow__viewport) {
		background: transparent !important;
	}

	/* Ensure controls also adapt to theme */
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

	/* Ensure all interactive elements have proper cursor */
	:global(.flow-container .svelte-flow .react-flow__node) {
		cursor: pointer !important;
	}

	:global(.flow-container .svelte-flow .react-flow__edge) {
		cursor: pointer !important;
	}

	:global(.flow-container .svelte-flow .react-flow__controls button) {
		cursor: pointer !important;
	}
</style>
