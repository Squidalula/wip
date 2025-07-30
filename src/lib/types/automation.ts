// Core automation types
export interface AutomationNode {
	id: string;
	type: string;
	nodeType: 'trigger' | 'action' | 'logic' | 'code';
	category: string;
	data: {
		label: string;
		description?: string;
		icon?: string;
		color?: string;
		config?: Record<string, any>;
	};
	position: { x: number; y: number };
	style?: string;
}

export interface AutomationEdge {
	id: string;
	source: string;
	target: string;
	type?: string;
	style?: string;
	data?: Record<string, any>;
}

// Simple edge type for flow execution (subset of AutomationEdge)
export interface Edge {
	id: string;
	source: string;
	target: string;
	type?: string;
}

export interface Workflow {
	id: string;
	name: string;
	description?: string;
	nodes: AutomationNode[];
	edges: AutomationEdge[];
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export type NodeCategory = 'trigger' | 'action' | 'logic' | 'code';

export interface NodeDefinition {
	id: string;
	name: string;
	description: string;
	category: NodeCategory;
	icon: any; // Lucide icon component
	color: string;
	inputs?: string[];
	outputs?: string[];
	config?: NodeConfigSchema;
}

// Flow execution interfaces
export interface ExecutionResult {
	nodeId: string;
	success: boolean;
	output?: any;
	error?: string;
	duration: number;
}

export interface FlowExecutionResult {
	flowId: string;
	success: boolean;
	results: ExecutionResult[];
	totalDuration: number;
	executionOrder: string[];
}

// Flow data interfaces 
export interface FlowData {
	id: string;
	name: string;
	description?: string;
	nodes: AutomationNode[];
	edges: Edge[];
	createdAt?: string;
	updatedAt?: string;
}

export interface FlowTemplate {
	id: string;
	name: string;
	description: string;
	nodes: AutomationNode[];
	edges: Edge[];
}

export interface NodeConfigSchema {
	[key: string]: {
		type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
		label: string;
		placeholder?: string;
		required?: boolean;
		options?: string[]; // for select type
		default?: any;
	};
}
