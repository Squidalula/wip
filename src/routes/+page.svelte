<script lang="ts">
	import FlowEditor from '../components/flow/FlowEditor.svelte';
	import HamburgerMenu from '../components/layout/HamburgerMenu.svelte';
	import { AddNodeButton, NodeSelectionModal } from '../components/nodes';
	import '../lib/examples/run-demo'; // Make demo available in console

	// Modal state management
	let showNodeModal = $state(false);
	let flowEditor: any = null;

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
		<FlowEditor onNodeAdd={handleFlowEditorReady} />
		<AddNodeButton onAddClick={openNodeModal} />
		
		<!-- Execute Flow Button -->
		<div class="fixed top-4 right-4 z-[100]">
			<button 
				class="btn btn-success shadow-lg cursor-pointer hover:btn-success"
				onclick={handleExecuteFlow}
				title="Execute Current Flow"
				style="pointer-events: auto;"
			>
				▶️ Execute
			</button>
		</div>
		<NodeSelectionModal
			isOpen={showNodeModal}
			onNodeSelect={handleNodeSelect}
			onClose={closeNodeModal}
		/>
	</div>
</div>
