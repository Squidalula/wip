<script lang="ts">
	import FlowEditor from '../components/flow/FlowEditor.svelte';
	import HamburgerMenu from '../components/layout/HamburgerMenu.svelte';
	import { AddNodeButton, NodeSelectionModal } from '../components/nodes';
	import { PanelRight } from 'lucide-svelte';
	import { themeManager } from '../lib/stores/theme.svelte';
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
		}
	}

	async function handleExecuteFlow() {
		if (flowEditor) {
			try {
				console.log('🚀 Starting flow execution...');
				const result = await flowEditor.executeCurrentFlow();
				
				if (result?.success) {
					console.log('✅ Flow executed successfully!');
					alert(`✅ Flow executed successfully!\nDuration: ${result.totalDuration}ms\nNodes executed: ${result.executionOrder.join(' → ')}`);
				} else {
					console.error('❌ Flow execution failed');
					alert('❌ Flow execution failed. Check console for details.');
				}
			} catch (error) {
				console.error('❌ Flow execution error:', error);
				alert('❌ Flow execution error. Check console for details.');
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
