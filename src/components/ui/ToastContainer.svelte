<script lang="ts">
	import ToastNotification, { type ToastData } from './ToastNotification.svelte';
	import { toastStore } from '../../lib/stores/toast.svelte';

	// Subscribe to the toast store
	const toasts = $derived(toastStore.toasts);

	function handleDismiss(event: CustomEvent<string>) {
		toastStore.dismiss(event.detail);
	}
</script>

<!-- Toast Container - Fixed positioned at top-right -->
<div class="toast toast-top toast-end z-[9999] max-w-md w-full p-4">
	{#each toasts as toast (toast.id)}
		<ToastNotification {toast} on:dismiss={handleDismiss} />
	{/each}
</div>
