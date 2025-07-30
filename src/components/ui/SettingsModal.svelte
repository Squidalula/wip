<script lang="ts">
	interface Props {
		isOpen: boolean;
		jiraApiKey: string;
		onClose: () => void;
		onSave: () => void;
		onJiraApiKeyChange: (value: string) => void;
	}

	const { isOpen, jiraApiKey, onClose, onSave, onJiraApiKeyChange }: Props = $props();

	// Close modal when clicking outside
	function handleBackdropClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target === event.currentTarget) {
			onClose();
		}
	}
</script>

<!-- Settings Modal -->
{#if isOpen}
	<div
		class="bg-opacity-20 fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-title"
		tabindex="-1"
	>
		<div
			class="animate-in zoom-in-95 mx-4 w-full max-w-md rounded-lg bg-base-100 shadow-xl duration-200"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-base-300 p-6">
				<h2 id="settings-title" class="text-lg font-semibold">Settings</h2>
				<button
					class="btn btn-circle cursor-pointer btn-ghost btn-sm"
					onclick={onClose}
					aria-label="Close settings"
				>
					✕
				</button>
			</div>

			<!-- Modal Content -->
			<div class="p-6">
				<div class="form-control w-full">
					<label class="label" for="jira-api-key">
						<span class="label-text">JIRA API Key</span>
					</label>
					<input
						id="jira-api-key"
						type="password"
						placeholder="Enter your JIRA API key"
						class="input-bordered input w-full cursor-pointer"
						value={jiraApiKey}
						oninput={(e) => onJiraApiKeyChange(e.currentTarget.value)}
					/>
					<div class="label">
						<span class="label-text-alt">This will be stored locally in your browser</span>
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="flex justify-end gap-3 border-t border-base-300 p-6">
				<button class="btn cursor-pointer btn-ghost" onclick={onClose}> Cancel </button>
				<button class="btn cursor-pointer btn-primary" onclick={onSave}> Save </button>
			</div>
		</div>
	</div>
{/if}
