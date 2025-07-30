import type { Theme } from '../types/ui';

export class ThemeManager {
	currentTheme = $state('light');

	// Available daisyUI themes - only light and dark variants
	themes: Theme[] = [
		{ name: 'light', bg: '#ffffff', flowTheme: 'light' as const },
		{ name: 'dark', bg: '#1d232a', flowTheme: 'dark' as const },
		{ name: 'corporate', bg: '#f8fafc', flowTheme: 'light' as const },
		{ name: 'business', bg: '#1f2937', flowTheme: 'dark' as const },
		{ name: 'black', bg: '#000000', flowTheme: 'dark' as const },
		{ name: 'night', bg: '#0f172a', flowTheme: 'dark' as const },
		{ name: 'winter', bg: '#f0f9ff', flowTheme: 'light' as const },
		{ name: 'dim', bg: '#2a323c', flowTheme: 'dark' as const }
	];

	constructor() {
		// Initialize theme from localStorage if available
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem('theme') || 'light';
			this.setTheme(savedTheme);
		}
	}

	setTheme(themeName: string) {
		this.currentTheme = themeName;

		if (typeof window !== 'undefined') {
			document.documentElement.setAttribute('data-theme', themeName);
			localStorage.setItem('theme', themeName);
		}

		console.log('Theme changed to:', themeName);
	}

	getThemeBackground(themeName: string): string {
		const theme = this.themes.find((t) => t.name === themeName);
		return theme?.bg || '#ffffff';
	}

	getCurrentThemeBackground(): string {
		return this.getThemeBackground(this.currentTheme);
	}

	isCurrentThemeDark(): boolean {
		const theme = this.themes.find((t) => t.name === this.currentTheme);
		return theme?.flowTheme === 'dark';
	}

	getCurrentFlowTheme(): 'light' | 'dark' {
		const theme = this.themes.find((t) => t.name === this.currentTheme);
		return theme?.flowTheme || 'light';
	}
}

// Create a singleton instance to share across components
export const themeManager = new ThemeManager();
