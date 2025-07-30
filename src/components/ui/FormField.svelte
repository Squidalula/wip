<script lang="ts">
	import type { FormField } from '../../lib/types/node-schemas';

	interface Props {
		field: FormField;
		value: any;
		onInput: (value: any) => void;
	}

	const { field, value, onInput }: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
		let newValue: any = target.value;

		// Type conversion for number fields
		if (field.type === 'number') {
			newValue = target.value === '' ? null : parseFloat(target.value);
		} else if (field.type === 'checkbox') {
			newValue = (target as HTMLInputElement).checked;
		}

		onInput(newValue);
	}

	// Generate unique ID for form fields
	const fieldId = `field-${field.id}`;
</script>

<div class="form-control w-full">
	<label class="label" for={fieldId}>
		<span class="label-text">
			{field.label}
			{#if field.required}
				<span class="text-error">*</span>
			{/if}
		</span>
	</label>

	{#if field.type === 'text' || field.type === 'password'}
		<input
			id={fieldId}
			type={field.type}
			class="input-bordered input w-full cursor-pointer"
			placeholder={field.placeholder || ''}
			required={field.required || false}
			value={value || ''}
			oninput={handleInput}
		/>
	{:else if field.type === 'number'}
		<input
			id={fieldId}
			type="number"
			class="input-bordered input w-full cursor-pointer"
			placeholder={field.placeholder || ''}
			required={field.required || false}
			min={field.validation?.min}
			max={field.validation?.max}
			value={value || ''}
			oninput={handleInput}
		/>
	{:else if field.type === 'textarea'}
		<textarea
			id={fieldId}
			class="textarea-bordered textarea cursor-pointer"
			class:h-24={!field.placeholder?.includes('prompt')}
			class:h-32={field.placeholder?.includes('prompt')}
			placeholder={field.placeholder || ''}
			required={field.required || false}
			value={value || ''}
			oninput={handleInput}
		></textarea>
	{:else if field.type === 'select' && field.options}
		<select
			id={fieldId}
			class="select-bordered select w-full cursor-pointer"
			required={field.required || false}
			value={value || field.default || ''}
			onchange={handleInput}
		>
			{#if !field.required}
				<option value="">Select an option</option>
			{/if}
			{#each field.options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	{:else if field.type === 'checkbox'}
		<div class="flex items-center gap-2">
			<input
				id={fieldId}
				type="checkbox"
				class="checkbox cursor-pointer"
				checked={value || false}
				onchange={handleInput}
			/>
			<span class="label-text">{field.placeholder || 'Enable this option'}</span>
		</div>
	{/if}

	{#if field.helpText}
		<div class="label">
			<span class="label-text-alt">{field.helpText}</span>
		</div>
	{/if}
</div>
