<script lang="ts">
	import FlowEditor from '../components/flow/FlowEditor.svelte';
	import HamburgerMenu from '../components/layout/HamburgerMenu.svelte';
	import { AddNodeButton, NodeSelectionModal } from '../components/nodes';
	import { ToastContainer } from '../components/ui';
	import { PanelRight } from 'lucide-svelte';
	import { themeManager } from '../lib/stores/theme.svelte';
	import { toastStore } from '../lib/stores/toast.svelte';
	import '../lib/examples/run-demo'; // Make demo available in console

	// Modal state management
	let showNodeModal = $state(false);
	let flowEditor: any = null;
	let isPanelCollapsed = $state(false);

	function openNodeModal() {
		showNodeModal = true;
	}

	function closeNodeModal() {
		showNodeModal = false;
	}

	function handleNodeSelect(nodeId: string) {
		console.log('Adding automation node to canvas:', nodeId);
		if (flowEditor) {
			flowEditor.addAutomationNode(nodeId);
			// Show success toast for node addition
			const nodeNames = {
				'llm': 'LLM Node',
				'jira-create-story': 'Create JIRA Story',
				'jira-add-comment': 'Add JIRA Comment',
				'get-jira-story': 'Get JIRA Story'
			} as const;
			const nodeName = nodeNames[nodeId as keyof typeof nodeNames] || nodeId;
			toastStore.success('Node added', `${nodeName} has been added to the canvas`);
		}
		closeNodeModal();
	}

	function handleFlowEditorReady(editor: any) {
		flowEditor = editor;
	}

	function handlePanelStateChange(isCollapsed: boolean) {
		isPanelCollapsed = isCollapsed;
	}

	function togglePanel() {
		// We need to communicate with the ResultsPanelLayout to toggle it
		if (flowEditor) {
			flowEditor.toggleResultsPanel();
		}
	}

	function handleResetCanvas() {
		if (flowEditor) {
			flowEditor.resetCanvas();
			toastStore.info('Canvas reset', 'All nodes and connections have been cleared');
		}
	}

	async function handleExecuteFlow() {
		if (flowEditor) {
			try {
				console.log('🚀 Starting flow execution...');
				const result = await flowEditor.executeCurrentFlow();
				
				if (result?.success) {
					console.log('✅ Flow executed successfully!');
					toastStore.success(
						'Flow executed successfully!',
						`Duration: ${result.totalDuration}ms | Nodes: ${result.executionOrder.join(' → ')}`
					);
				} else {
					console.error('❌ Flow execution failed');
					toastStore.error(
						'Flow execution failed',
						'Check the console for detailed error information.'
					);
				}
			} catch (error) {
				console.error('❌ Flow execution error:', error);
				toastStore.error(
					'Flow execution error',
					error instanceof Error ? error.message : 'An unexpected error occurred. Check the console for details.'
				);
			}
		}
	}
</script>

<div class="flex h-screen">
	<div class="flex-1">
		<HamburgerMenu onReset={handleResetCanvas} />
		<FlowEditor onNodeAdd={handleFlowEditorReady} onPanelStateChange={handlePanelStateChange} />
		<AddNodeButton onAddClick={openNodeModal} isPanelCollapsed={isPanelCollapsed} />
		
		<!-- Execute Flow and Toggle Panel Buttons -->
		{#if !showNodeModal}
			<div class="fixed top-4 z-[100] transition-all duration-300 flex gap-2" style="right: {isPanelCollapsed ? '16px' : '400px'};">
				<!-- Execute Flow Button -->
				<button 
					class="btn btn-success shadow-lg cursor-pointer hover:btn-success"
					onclick={handleExecuteFlow}
					title="Execute Current Flow"
					style="pointer-events: auto;"
				>
					▶️ Execute
				</button>

				<!-- Toggle Panel Button -->
				<button 
					class="btn btn-circle shadow-lg cursor-pointer transition-all duration-300"
					onclick={togglePanel}
					title={isPanelCollapsed ? 'Show Results Panel' : 'Hide Results Panel'}
					style="
						background-color: {themeManager.isCurrentThemeDark() ? '#374151' : '#f3f4f6'}; 
						color: {themeManager.isCurrentThemeDark() ? '#f9fafb' : '#374151'};
						border: 1px solid {themeManager.isCurrentThemeDark() ? '#4b5563' : '#d1d5db'};
					"
				>
					<PanelRight class="h-5 w-5" />
				</button>
			</div>
		{/if}
		<NodeSelectionModal
			isOpen={showNodeModal}
			onNodeSelect={handleNodeSelect}
			onClose={closeNodeModal}
		/>
	</div>
</div>

<!-- Toast Container for notifications -->
<ToastContainer />
