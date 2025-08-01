<script lang="ts">
	import NodeOutputPanel from './NodeOutputPanel.svelte';
	import FlowExecutionPanel from './FlowExecutionPanel.svelte';
	import { themeManager } from '../../lib/stores/theme.svelte';
	import type { ExecutionResult, AutomationNode, FlowExecutionResult } from '../../lib/types/automation';

	interface Props {
		selectedNode: AutomationNode | null;
		selectedNodeResult: ExecutionResult | null;
		flowExecutionResult: FlowExecutionResult | null;
		isExecuting?: boolean;
		onClearResults?: () => void;
		onCollapseChange?: (isCollapsed: boolean) => void;
		isCollapsedExternal?: boolean;
	}

	const { 
		selectedNode, 
		selectedNodeResult, 
		flowExecutionResult, 
		isExecuting = false,
		onClearResults,
		onCollapseChange,
		isCollapsedExternal 
	}: Props = $props();


	let isCollapsed = $state(false);
	let activeTab = $state<'node' | 'flow'>('node');


	$effect(() => {
		if (isExecuting || flowExecutionResult) {
			activeTab = 'flow';
		}
	});


	$effect(() => {
		if (selectedNode && !isExecuting) {
			activeTab = 'node';
		}
	});


	$effect(() => {
		onCollapseChange?.(isCollapsed);
	});


	$effect(() => {
		if (isCollapsedExternal !== undefined) {
			isCollapsed = isCollapsedExternal;
		}
	});



	function setActiveTab(tab: 'node' | 'flow') {
		activeTab = tab;

		if (isCollapsed) {
			isCollapsed = false;
		}
	}


	function getNodeTabBadge(): boolean {
		return !!(selectedNode && selectedNodeResult);
	}

	function getFlowTabBadge(): boolean {
		return !!(flowExecutionResult || isExecuting);
	}

	function getFlowTabBadgeCount(): number {
		if (!flowExecutionResult) return 0;
		return flowExecutionResult.results.filter(r => !r.success).length;
	}


	const panelStyles = $derived(() => {
		const isDark = themeManager.isCurrentThemeDark();
		return {
			backgroundColor: isDark ? '#1f2937' : '#f8fafc',
			borderColor: isDark ? '#374151' : '#e5e7eb',
			textColor: isDark ? '#f9fafb' : '#111827',
			tabBg: isDark ? '#374151' : '#ffffff',
			tabActiveBg: isDark ? '#4b5563' : '#eff6ff',
			tabHoverBg: isDark ? '#4b5563' : '#f3f4f6',
			toggleBg: isDark ? '#374151' : '#f3f4f6',
			toggleHoverBg: isDark ? '#4b5563' : '#e5e7eb'
		};
	});
</script>


<div class="flex h-full">

	<div 
		class="flex flex-col transition-all duration-300 ease-in-out {isCollapsed ? 'w-0' : 'w-96'} min-w-0"
		style="background-color: {panelStyles().backgroundColor}; border-left: 2px solid {panelStyles().borderColor};"
	>
		{#if !isCollapsed}

			<div 
				class="flex-shrink-0 border-b"
				style="background-color: {panelStyles().tabBg}; border-color: {panelStyles().borderColor};"
			>
				<div class="flex">

					<button
						onclick={() => setActiveTab('node')}
						class="flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer relative border-b-2 hover:opacity-80"
						style="
							color: {activeTab === 'node' ? (themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000') : panelStyles().textColor};
							background-color: {activeTab === 'node' ? panelStyles().tabActiveBg : 'transparent'};
							border-bottom-color: {activeTab === 'node' ? (themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000') : 'transparent'};
						"
					>
						Node Output
					</button>


					<button
						onclick={() => setActiveTab('flow')}
						class="flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer relative border-b-2 hover:opacity-80"
						style="
							color: {activeTab === 'flow' ? (themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000') : panelStyles().textColor};
							background-color: {activeTab === 'flow' ? panelStyles().tabActiveBg : 'transparent'};
							border-bottom-color: {activeTab === 'flow' ? (themeManager.isCurrentThemeDark() ? '#ffffff' : '#000000') : 'transparent'};
						"
					>
						Flow Execution
					</button>
				</div>
			</div>


			<div class="flex-1 min-h-0">
				{#if activeTab === 'node'}
					<NodeOutputPanel 
						{selectedNode} 
						executionResult={selectedNodeResult}
						{isExecuting}
					/>
				{:else if activeTab === 'flow'}
					<FlowExecutionPanel 
						executionResult={flowExecutionResult}
						{isExecuting}
						{onClearResults}
					/>
				{/if}
			</div>
		{/if}
	</div>


</div>



 