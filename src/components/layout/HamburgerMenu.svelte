<script lang="ts">
	import { Download, FolderOpen, Menu, Palette, RotateCcw, Settings } from 'lucide-svelte';
	import { themeManager } from '../../lib/stores/theme.svelte';
	import SettingsModal from '../ui/SettingsModal.svelte';

	export class HamburgerMenuController {
		isOpen = $state(false);
		isSettingsOpen = $state(false);
		jiraApiKey = $state('');

		constructor() {
			// Load JIRA API key from localStorage on initialization
			if (typeof window !== 'undefined') {
				this.jiraApiKey = localStorage.getItem('jiraApiKey') || '';
			}
		}

		toggleMenu() {
			this.isOpen = !this.isOpen;
		}

		closeMenu() {
			this.isOpen = false;
		}

		openSettings() {
			this.isSettingsOpen = true;
			this.closeMenu();
		}

		closeSettings() {
			this.isSettingsOpen = false;
		}

		updateJiraApiKey(value: string) {
			this.jiraApiKey = value;
		}

		saveJiraApiKey() {
			if (typeof window !== 'undefined') {
				localStorage.setItem('jiraApiKey', this.jiraApiKey);
			}
			console.log('JIRA API Key saved:', this.jiraApiKey);
			this.closeSettings();
		}

		handleOpen() {
			console.log('Open file dialog');
			// TODO: Implement file open functionality
			this.closeMenu();
		}

		handleSave() {
			console.log('Save file dialog');
			// TODO: Implement file save functionality
			this.closeMenu();
		}

		handleReset() {
			console.log('Reset canvas');
			this.closeMenu();
		}

		changeTheme(theme: string) {
			themeManager.setTheme(theme);
		}
	}

	// Props
	const { onReset }: { onReset?: () => void } = $props();

	const menuController = new HamburgerMenuController();

	// Close menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.hamburger-menu')) {
			menuController.closeMenu();
		}
	}

	function handleResetClick() {
		menuController.handleReset();
		if (onReset) {
			onReset();
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="hamburger-menu fixed top-4 left-4 z-50">
	<!-- Hamburger Button -->
	<button
		class="btn btn-circle cursor-pointer shadow-lg transition-all duration-200 btn-primary hover:shadow-xl"
		onclick={() => menuController.toggleMenu()}
		aria-label="Menu"
	>
		<Menu size={20} />
	</button>

	<!-- Menu Dropdown -->
	{#if menuController.isOpen}
		<div
			class="animate-in slide-in-from-top-2 mt-2 w-64 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-xl duration-200"
		>
			<!-- Open Option -->
			<button
				class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-base-200"
				onclick={() => menuController.handleOpen()}
			>
				<FolderOpen size={18} />
				<span>Open</span>
				<span class="ml-auto text-xs text-base-content/60">Cmd+O</span>
			</button>

			<!-- Save To Option -->
			<button
				class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-base-200"
				onclick={() => menuController.handleSave()}
			>
				<Download size={18} />
				<span>Save to...</span>
				<span class="ml-auto text-xs text-base-content/60">Cmd+S</span>
			</button>

			<!-- Reset Canvas Option -->
			<button
				class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-base-200"
				onclick={handleResetClick}
			>
				<RotateCcw size={18} />
				<span>Reset the canvas</span>
			</button>

			<!-- Settings Option -->
			<button
				class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-base-200"
				onclick={() => menuController.openSettings()}
			>
				<Settings size={18} />
				<span>Settings</span>
			</button>

			<div class="divider my-0"></div>

			<!-- Theme Section -->
			<div class="px-4 py-3">
				<div class="mb-3 flex items-center gap-3">
					<Palette size={18} />
					<span class="font-medium">Theme</span>
				</div>

				<!-- Canvas Background Display -->
				<div class="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
					{#each themeManager.themes as theme}
						<button
							class="h-12 w-12 cursor-pointer rounded border-2 transition-all duration-200 {themeManager.currentTheme ===
							theme.name
								? 'border-4 border-primary'
								: 'border-base-300 hover:scale-110'}"
							style="background-color: {theme.bg}"
							onclick={() => menuController.changeTheme(theme.name)}
							aria-label="Select {theme.name} theme"
							title={theme.name}
						></button>
					{/each}
				</div>

				<div class="mt-2 text-center text-xs text-base-content/60">
					Current: {themeManager.currentTheme}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Settings Modal Component -->
<SettingsModal
	isOpen={menuController.isSettingsOpen}
	jiraApiKey={menuController.jiraApiKey}
	onClose={() => menuController.closeSettings()}
	onSave={() => menuController.saveJiraApiKey()}
	onJiraApiKeyChange={(value) => menuController.updateJiraApiKey(value)}
/>
