<script lang="ts">
	import { Play, AlertCircle, CheckCircle, Clock, FileText, Copy } from 'lucide-svelte';
	import { themeManager } from '../../lib/stores/theme.svelte';
	import type { ExecutionResult, AutomationNode } from '../../lib/types/automation';

	interface Props {
		selectedNode: AutomationNode | null;
		executionResult: ExecutionResult | null;
		isExecuting?: boolean;
	}

	const { selectedNode, executionResult, isExecuting = false }: Props = $props();

	// Format duration for display
	function formatDuration(duration: number): string {
		if (duration < 1000) {
			return `${duration}ms`;
		}
		return `${(duration / 1000).toFixed(2)}s`;
	}

	// Format output for display
	function formatOutput(output: any): string {
		if (!output) return 'No output';
		if (typeof output === 'string') return output;
		return JSON.stringify(output, null, 2);
	}

	// Copy output to clipboard
	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			// Could add a toast notification here
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}

	// Get status icon and color
	function getStatusIcon(result: ExecutionResult | null) {
		if (!result) return { icon: Clock, color: 'text-gray-400' };
		if (result.success) return { icon: CheckCircle, color: 'text-green-500' };
		return { icon: AlertCircle, color: 'text-red-500' };
	}

	// Get node type color
	function getNodeTypeColor(nodeType: string): string {
		const colors: Record<string, string> = {
			trigger: 'bg-blue-100 text-blue-800',
			action: 'bg-purple-100 text-purple-800',
			logic: 'bg-orange-100 text-orange-800',
			code: 'bg-gray-100 text-gray-800'
		};
		return colors[nodeType] || 'bg-gray-100 text-gray-800';
	}

	// Theme-aware styling
	const componentStyles = $derived(() => {
		const isDark = themeManager.isCurrentThemeDark();
		return {
			backgroundColor: isDark ? '#1f2937' : '#ffffff',
			headerBg: isDark ? '#374151' : '#f9fafb',
			borderColor: isDark ? '#4b5563' : '#e5e7eb',
			textColor: isDark ? '#f9fafb' : '#111827',
			textMuted: isDark ? '#9ca3af' : '#6b7280',
			iconColor: isDark ? '#9ca3af' : '#6b7280',
			cardBg: isDark ? '#374151' : '#f9fafb',
			contentBg: isDark ? '#1f2937' : '#ffffff',
			codeBg: isDark ? '#111827' : '#f3f4f6',
			placeholderBg: isDark ? '#374151' : '#f3f4f6'
		};
	});
</script>

<div 
	class="flex h-full flex-col"
	style="background-color: {componentStyles().backgroundColor};"
>
	<!-- Header -->
	<div 
		class="flex-shrink-0 px-4 py-3 border-b"
		style="background-color: {componentStyles().headerBg}; border-color: {componentStyles().borderColor};"
	>
		<div class="flex items-center gap-2">
			<FileText class="h-5 w-5" style="color: {componentStyles().iconColor};" />
			<h3 class="font-semibold" style="color: {componentStyles().textColor};">Node Output</h3>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto">
		{#if !selectedNode}
			<!-- No node selected state -->
			<div class="flex flex-col items-center justify-center h-full p-6 text-center">
				<div class="rounded-full p-3 mb-4" style="background-color: {componentStyles().placeholderBg};">
					<Play class="h-8 w-8" style="color: {componentStyles().iconColor};" />
				</div>
				<h4 class="text-lg font-medium mb-2" style="color: {componentStyles().textColor};">No Node Selected</h4>
				<p class="max-w-sm" style="color: {componentStyles().textMuted};">
					Click on a node in the flow to view its configuration and execution results.
				</p>
			</div>
		{:else}
			<!-- Node selected - show info and results -->
			<div class="p-4 space-y-4">
				<!-- Node Info -->
				<div class="rounded-lg p-4" style="background-color: {componentStyles().cardBg};">
					<div class="flex items-center justify-between mb-3">
						<h4 class="font-medium" style="color: {componentStyles().textColor};">{selectedNode.data.label}</h4>
						<span class="px-2 py-1 text-xs rounded-full {getNodeTypeColor(selectedNode.nodeType)}">
							{selectedNode.nodeType}
						</span>
					</div>
					
					<div class="text-sm space-y-1" style="color: {componentStyles().textMuted};">
						<p><span class="font-medium">ID:</span> {selectedNode.id}</p>
						<p><span class="font-medium">Category:</span> {selectedNode.category}</p>
						{#if selectedNode.data.description}
							<p><span class="font-medium">Description:</span> {selectedNode.data.description}</p>
						{/if}
					</div>
				</div>

				<!-- Execution Status -->
				<div class="border rounded-lg p-4" style="background-color: {componentStyles().contentBg}; border-color: {componentStyles().borderColor};">
					<h5 class="font-medium mb-3 flex items-center gap-2" style="color: {componentStyles().textColor};">
						{#if isExecuting}
							<div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
							Executing...
						{:else}
							{@const statusInfo = getStatusIcon(executionResult)}
							<statusInfo.icon class="h-4 w-4 {statusInfo.color}" />
							Execution Result
						{/if}
					</h5>

					{#if isExecuting}
						<p class="text-sm" style="color: {componentStyles().textMuted};">Node is currently executing...</p>
					{:else if !executionResult}
						<p class="text-sm" style="color: {componentStyles().textMuted};">
							No execution results available. Run the flow to see output.
						</p>
					{:else}
						{@const statusInfo = getStatusIcon(executionResult)}
						<!-- Execution Details -->
						<div class="space-y-3">
							<div class="flex items-center justify-between text-sm">
								<span style="color: {componentStyles().textMuted};">Status:</span>
								<span class="flex items-center gap-1 {executionResult.success ? 'text-green-600' : 'text-red-600'}">
									<statusInfo.icon class="h-3 w-3" />
									{executionResult.success ? 'Success' : 'Failed'}
								</span>
							</div>
							
							<div class="flex items-center justify-between text-sm">
								<span style="color: {componentStyles().textMuted};">Duration:</span>
								<span class="font-mono" style="color: {componentStyles().textColor};">{formatDuration(executionResult.duration)}</span>
							</div>

							{#if executionResult.error}
								<!-- Error Display -->
								<div class="mt-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm font-medium text-red-700">Error:</span>
									</div>
									<div class="bg-red-50 border border-red-200 rounded p-3">
										<pre class="text-sm text-red-800 whitespace-pre-wrap">{executionResult.error}</pre>
									</div>
								</div>
							{/if}

							{#if executionResult.output}
								<!-- Output Display -->
								<div class="mt-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm font-medium" style="color: {componentStyles().textColor};">Output:</span>
										<button
											onclick={() => copyToClipboard(formatOutput(executionResult.output))}
											class="p-1 rounded transition-colors duration-150 cursor-pointer hover:opacity-80"
											style="color: {componentStyles().iconColor};"
											title="Copy to clipboard"
										>
											<Copy class="h-4 w-4" />
										</button>
									</div>
									<div class="border rounded p-3 max-h-64 overflow-y-auto" style="background-color: {componentStyles().codeBg}; border-color: {componentStyles().borderColor};">
										<pre class="text-sm whitespace-pre-wrap" style="color: {componentStyles().textColor};">{formatOutput(executionResult.output)}</pre>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Node Configuration (if available) -->
				{#if selectedNode.data.config && Object.keys(selectedNode.data.config).length > 0}
					<div class="border rounded-lg p-4" style="background-color: {componentStyles().contentBg}; border-color: {componentStyles().borderColor};">
						<h5 class="font-medium mb-3" style="color: {componentStyles().textColor};">Configuration</h5>
						<div class="border rounded p-3 max-h-48 overflow-y-auto" style="background-color: {componentStyles().codeBg}; border-color: {componentStyles().borderColor};">
							<pre class="text-sm whitespace-pre-wrap" style="color: {componentStyles().textColor};">{JSON.stringify(selectedNode.data.config, null, 2)}</pre>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom scrollbar for better UX */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f5f9;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}
</style> 