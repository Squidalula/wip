<script lang="ts">
	import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export interface ToastData {
		id: string;
		type: 'success' | 'error' | 'warning' | 'info';
		title: string;
		message?: string;
		duration?: number; // Auto-dismiss time in ms, 0 for manual dismiss only
		dismissible?: boolean;
	}

	interface Props {
		toast: ToastData;
	}

	const { toast }: Props = $props();
	const dispatch = createEventDispatcher<{ dismiss: string }>();

	// Icon mapping
	const icons = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertCircle,
		info: Info
	};

	// Color mapping for DaisyUI classes
	const colorClasses = {
		success: 'alert-success',
		error: 'alert-error',
		warning: 'alert-warning',
		info: 'alert-info'
	};

	const iconColorClasses = {
		success: 'text-success-content',
		error: 'text-error-content',
		warning: 'text-warning-content',
		info: 'text-info-content'
	};

	const Icon = icons[toast.type];

	// Auto-dismiss functionality
	let timeoutId: number | null = null;

	$effect(() => {
		if (toast.duration && toast.duration > 0) {
			timeoutId = setTimeout(() => {
				handleDismiss();
			}, toast.duration);
		}

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	});

	function handleDismiss() {
		dispatch('dismiss', toast.id);
	}
</script>

<div
	class="alert {colorClasses[toast.type]} animate-in slide-in-from-right-full duration-300 ease-out shadow-lg"
	role="alert"
>
	<Icon size={20} class={iconColorClasses[toast.type]} />
	<div class="flex-1">
		<div class="font-medium">{toast.title}</div>
		{#if toast.message}
			<div class="text-sm opacity-90">{toast.message}</div>
		{/if}
	</div>
	{#if toast.dismissible !== false}
		<button
			class="btn btn-circle btn-ghost btn-sm"
			onclick={handleDismiss}
			aria-label="Dismiss notification"
		>
			<X size={16} />
		</button>
	{/if}
</div>
