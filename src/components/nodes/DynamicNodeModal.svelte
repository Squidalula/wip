<script lang="ts">
	import { X, Bot, MessageSquare, Plus, MessageCircle, Database } from 'lucide-svelte';
	import { getNodeSchema } from '../../lib/types/node-schemas';
	import FormField from '../ui/FormField.svelte';

	interface NodeData {
		id: string;
		type: string;
		category: string;
		data: {
			label: string;
			config?: any;
		};
		position: { x: number; y: number };
	}

	interface Props {
		isOpen: boolean;
		node: NodeData | null;
		position: { x: number; y: number };
		onClose: () => void;
		onSave: (nodeId: string, config: any) => void;
		onDelete: (nodeId: string) => void;
	}

	const { isOpen, node, position, onClose, onSave, onDelete }: Props = $props();

	// Dynamic configuration state
	let currentConfig = $state<Record<string, any>>({});

	// Get the schema for the current node
	const nodeSchema = $derived(() => {
		if (!node) return null;
		return getNodeSchema(node.category);
	});

	// Icon component mapping
	const iconComponents = {
		Bot,
		MessageSquare,
		Plus,
		MessageCircle,
		Database
	};

	// Initialize config when node changes
	$effect(() => {
		if (node && nodeSchema()) {
			// Start with schema defaults
			const schema = nodeSchema()!;
			currentConfig = {
				...schema.defaults,
				...node.data?.config // Override with saved config if it exists
			};
		} else {
			currentConfig = {};
		}
	});

	function handleSave() {
		if (!node) return;

		onSave(node.id, currentConfig);
		onClose();
	}

	function handleDelete() {
		if (!node) return;
		onDelete(node.id);
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target === event.currentTarget) {
			onClose();
		}
	}

	function handleFieldInput(fieldId: string, value: any) {
		currentConfig = {
			...currentConfig,
			[fieldId]: value
		};
	}

	// Validation helper
	function isValid(): boolean {
		if (!nodeSchema()) return true;

		return nodeSchema()!.fields.every((field) => {
			if (!field.required) return true;
			const value = currentConfig[field.id];
			return value !== undefined && value !== null && value !== '';
		});
	}
</script>

<!-- Node Configuration Modal -->
{#if isOpen && node && nodeSchema()}
	{@const schema = nodeSchema()!}
	{@const IconComponent = iconComponents[schema.icon as keyof typeof iconComponents]}

	<div
		class="bg-opacity-20 fixed inset-0 z-[70] flex items-center justify-center bg-black backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="node-modal-title"
		tabindex="-1"
	>
		<div
			class="animate-in zoom-in-95 mx-4 w-full max-w-lg rounded-lg bg-base-100 shadow-xl duration-200"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-base-300 p-6">
				<div class="flex items-center gap-3">
					{#if IconComponent}
						<IconComponent size={20} class={schema.iconColor} />
					{/if}
					<h2 id="node-modal-title" class="text-lg font-semibold">{schema.title} Configuration</h2>
				</div>
				<button
					class="btn btn-circle cursor-pointer btn-ghost btn-sm"
					onclick={onClose}
					aria-label="Close configuration"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Modal Content -->
			<div class="max-h-96 overflow-y-auto p-6">
				<div class="space-y-4">
					{#each schema.fields as field (field.id)}
						<FormField
							{field}
							value={currentConfig[field.id]}
							onInput={(value) => handleFieldInput(field.id, value)}
						/>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="flex justify-between border-t border-base-300 p-6">
				<button class="btn cursor-pointer btn-outline btn-error" onclick={handleDelete}>
					Delete Node
				</button>

				<div class="flex gap-3">
					<button class="btn cursor-pointer btn-ghost" onclick={onClose}> Cancel </button>
					<button
						class="btn cursor-pointer btn-primary"
						class:btn-disabled={!isValid()}
						onclick={handleSave}
						disabled={!isValid()}
					>
						Save Configuration
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
