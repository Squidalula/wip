<script lang="ts">
	import { Play, CheckCircle, AlertCircle, Clock, Activity, ArrowRight, RotateCcw } from 'lucide-svelte';
	import { themeManager } from '../../lib/stores/theme.svelte';
	import type { FlowExecutionResult, ExecutionResult } from '../../lib/types/automation';

	interface Props {
		executionResult: FlowExecutionResult | null;
		isExecuting?: boolean;
		onClearResults?: () => void;
	}

	const { executionResult, isExecuting = false, onClearResults }: Props = $props();

	// Format duration for display
	function formatDuration(duration: number): string {
		if (duration < 1000) {
			return `${duration}ms`;
		}
		return `${(duration / 1000).toFixed(2)}s`;
	}

	// Get status icon and color for individual results
	function getStatusIcon(result: ExecutionResult) {
		if (result.success) {
			return { icon: CheckCircle, color: 'text-green-500' };
		}
		return { icon: AlertCircle, color: 'text-red-500' };
	}

	// Get overall execution status
	function getOverallStatus(result: FlowExecutionResult | null) {
		if (!result) return { icon: Clock, color: 'text-gray-400', text: 'Not executed' };
		if (result.success) return { icon: CheckCircle, color: 'text-green-500', text: 'Completed successfully' };
		return { icon: AlertCircle, color: 'text-red-500', text: 'Failed' };
	}

	// Calculate execution progress
	function getExecutionProgress(result: FlowExecutionResult | null): number {
		if (!result || result.results.length === 0) return 0;
		return (result.results.length / (result.executionOrder.length || result.results.length)) * 100;
	}

	// Truncate long text
	function truncateText(text: string, maxLength: number = 100): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	// Format output preview - show full content, don't truncate
	function formatOutputPreview(output: any): string {
		if (!output) return 'No output';
		if (typeof output === 'string') return output;
		return JSON.stringify(output, null, 2);
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
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Activity class="h-5 w-5" style="color: {componentStyles().iconColor};" />
				<h3 class="font-semibold" style="color: {componentStyles().textColor};">Flow Execution</h3>
			</div>
			{#if executionResult && onClearResults}
				<button
					onclick={onClearResults}
					class="p-1 rounded hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
					title="Clear results"
				>
					<RotateCcw class="h-4 w-4 text-gray-500" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto">
		{#if isExecuting}
			<!-- Executing state -->
			<div class="p-4">
				<div class="text-center py-8">
					<div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
					<h4 class="text-lg font-medium text-gray-900 mb-2">Executing Flow</h4>
					<p class="text-gray-500">Please wait while the flow is running...</p>
				</div>
				
				{#if executionResult}
					<!-- Show partial results during execution -->
					<div class="mt-6">
						<h5 class="font-medium text-gray-900 mb-3">Progress</h5>
						<div class="space-y-2">
							{#each executionResult.results as result, index}
								{@const statusInfo = getStatusIcon(result)}
								<div class="flex items-center gap-3 p-3 rounded-lg">
									<statusInfo.icon class="h-4 w-4 {statusInfo.color}" />
									<span class="text-sm font-medium">Step {index + 1}</span>
									<span class="text-sm text-gray-600">({result.nodeId})</span>
									<span class="text-xs text-gray-500 ml-auto">{formatDuration(result.duration)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if !executionResult}
			<!-- No execution results state -->
			<div class="flex flex-col items-center justify-center h-full p-6 text-center">
				<div class="rounded-full p-3 mb-4" style="background-color: {componentStyles().placeholderBg};">
					<Play class="h-8 w-8" style="color: {componentStyles().iconColor};" />
				</div>
				<h4 class="text-lg font-medium mb-2" style="color: {componentStyles().textColor};">No Execution Results</h4>
				<p class="max-w-sm" style="color: {componentStyles().textMuted};">
					Run the flow to see step-by-step execution results and timing information.
				</p>
			</div>
		{:else}
			{@const overallStatus = getOverallStatus(executionResult)}
			<!-- Execution results display -->
			<div class="p-4 space-y-4">
				<!-- Overall Status -->
				<div class="rounded-lg p-4" style="background-color: {componentStyles().cardBg};">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<overallStatus.icon class="h-5 w-5 {overallStatus.color}" />
							<h4 class="font-medium" style="color: {componentStyles().textColor};">{overallStatus.text}</h4>
						</div>
						<span class="text-sm" style="color: {componentStyles().textMuted};">
							{formatDuration(executionResult.totalDuration)}
						</span>
					</div>
					
					<!-- Progress Bar -->
					<div class="w-full rounded-full h-2 mb-3" style="background-color: {componentStyles().borderColor};">
						<div 
							class="h-2 rounded-full transition-all duration-300 {executionResult.success ? 'bg-green-500' : 'bg-red-500'}"
							style="width: {getExecutionProgress(executionResult)}%"
						></div>
					</div>
					
					<div class="text-sm space-y-1" style="color: {componentStyles().textMuted};">
						<div class="flex justify-between">
							<span>Steps completed:</span>
							<span>{executionResult.results.length} / {executionResult.executionOrder.length}</span>
						</div>
						<div class="flex justify-between">
							<span>Success rate:</span>
							<span>{Math.round((executionResult.results.filter(r => r.success).length / executionResult.results.length) * 100)}%</span>
						</div>
					</div>
				</div>



				<!-- Step-by-Step Results -->
				<div class="border rounded-lg p-4" style="background-color: {componentStyles().contentBg}; border-color: {componentStyles().borderColor};">
					<h5 class="font-medium mb-4" style="color: {componentStyles().textColor};">Step Results</h5>
					<div class="space-y-3">
						{#each executionResult.results as result, index}
							{@const statusInfo = getStatusIcon(result)}
							<div class="border rounded-lg p-4" style="border-color: {componentStyles().borderColor};">
								<!-- Step Header -->
								<div class="flex items-start justify-between mb-3 gap-3">
									<div class="flex items-start gap-2 min-w-0 flex-1">
										<span class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0" style="background-color: {componentStyles().contentBg}; color: {componentStyles().textColor};">
											{index + 1}
										</span>
										<statusInfo.icon class="h-4 w-4 {statusInfo.color} flex-shrink-0 mt-0.5" />
										<span class="font-medium break-all" style="color: {componentStyles().textColor};">{result.nodeId}</span>
									</div>
									<span class="text-sm font-mono flex-shrink-0" style="color: {componentStyles().textMuted};">
										{formatDuration(result.duration)}
									</span>
								</div>

								<!-- Success/Error Status -->
								<div class="text-sm mb-2">
									<span class="font-medium {result.success ? 'text-green-700' : 'text-red-700'}">
										{result.success ? 'Success' : 'Failed'}
									</span>
									{#if result.error}
										<div class="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-800">
											<span class="font-medium">Error:</span> {result.error}
										</div>
									{/if}
								</div>

								<!-- Output Preview -->
								{#if result.output}
									<div class="text-sm">
										<span class="font-medium" style="color: {componentStyles().textColor};">Output:</span>
										<div class="mt-1 p-3 rounded font-mono text-sm max-h-48 overflow-y-auto" style="background-color: {componentStyles().codeBg}; color: {componentStyles().textColor};">
											<pre class="whitespace-pre-wrap break-words">{formatOutputPreview(result.output)}</pre>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Failed Steps Summary (if any) -->
				{#if executionResult.results.filter(r => !r.success).length > 0}
					{@const failedSteps = executionResult.results.filter(r => !r.success)}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<h5 class="font-medium text-red-900 mb-3 flex items-center gap-2">
							<AlertCircle class="h-4 w-4" />
							Failed Steps ({failedSteps.length})
						</h5>
						<div class="space-y-2">
							{#each failedSteps as failedStep}
								<div class="text-sm text-red-800">
									<span class="font-medium">{failedStep.nodeId}:</span>
									{failedStep.error || 'Unknown error'}
								</div>
							{/each}
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