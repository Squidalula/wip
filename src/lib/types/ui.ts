
export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
	size?: 'xs' | 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	onClick?: () => void;
}

export interface Theme {
	name: string;
	bg: string;
	flowTheme: 'light' | 'dark';
}

export interface SearchInputProps {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	duration?: number;
}
