import type { ToastData } from '../../components/ui/ToastNotification.svelte';

class ToastStore {
	toasts = $state<ToastData[]>([]);

	/**
	 * Add a new toast notification
	 */
	add(toast: Omit<ToastData, 'id'>) {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const newToast: ToastData = {
			id,
			duration: 5000, // Default 5 seconds
			dismissible: true,
			...toast
		};

		this.toasts = [...this.toasts, newToast];
		return id;
	}

	/**
	 * Dismiss a toast by ID
	 */
	dismiss(id: string) {
		this.toasts = this.toasts.filter(toast => toast.id !== id);
	}

	/**
	 * Clear all toasts
	 */
	clear() {
		this.toasts = [];
	}

	/**
	 * Convenience methods for different toast types
	 */
	success(title: string, message?: string, options?: Partial<ToastData>) {
		return this.add({
			type: 'success',
			title,
			message,
			...options
		});
	}

	error(title: string, message?: string, options?: Partial<ToastData>) {
		return this.add({
			type: 'error',
			title,
			message,
			duration: 8000, // Errors stay longer
			...options
		});
	}

	warning(title: string, message?: string, options?: Partial<ToastData>) {
		return this.add({
			type: 'warning',
			title,
			message,
			duration: 6000,
			...options
		});
	}

	info(title: string, message?: string, options?: Partial<ToastData>) {
		return this.add({
			type: 'info',
			title,
			message,
			...options
		});
	}
}

export const toastStore = new ToastStore();
