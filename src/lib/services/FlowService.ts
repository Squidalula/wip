import type { AutomationNode, FlowData, FlowTemplate, Edge } from '../types/automation';

class FlowService {
	private flows: Map<string, FlowData> = new Map();

	// Default flows - minimal templates only
	private defaultFlows: FlowTemplate[] = [
		{
			id: 'empty',
			name: 'Empty Canvas',
			description: 'Start with a blank canvas',
			nodes: [],
			edges: []
		}
	];

	// Get available templates
	async getFlowTemplates(): Promise<FlowTemplate[]> {
		return this.defaultFlows;
	}

	// Get a specific flow by ID
	async getFlow(id: string): Promise<FlowData | null> {
		// Check saved flows first
		if (this.flows.has(id)) {
			return this.flows.get(id)!;
		}

		// Fallback to templates
		const template = this.defaultFlows.find(t => t.id === id);
		if (template) {
			return {
				...template,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
		}
		return null;
	}

	// Save a new flow
	async saveFlow(flow: Omit<FlowData, 'id' | 'createdAt' | 'updatedAt'>): Promise<FlowData> {
		const id = `flow_${Date.now()}`;
		const now = new Date().toISOString();
		
		const savedFlow: FlowData = {
			...flow,
			id,
			createdAt: now,
			updatedAt: now
		};
		
		this.flows.set(id, savedFlow);
		return savedFlow;
	}

	// Update an existing flow
	async updateFlow(id: string, flow: Partial<FlowData>): Promise<FlowData> {
		const existing = this.flows.get(id);
		if (!existing) {
			throw new Error(`Flow with id ${id} not found`);
		}

		const updatedFlow: FlowData = {
			...existing,
			...flow,
			id, // Preserve original ID
			updatedAt: new Date().toISOString()
		};

		this.flows.set(id, updatedFlow);
		return updatedFlow;
	}

	// Delete a flow
	async deleteFlow(id: string): Promise<void> {
		if (!this.flows.has(id)) {
			throw new Error(`Flow with id ${id} not found`);
		}
		this.flows.delete(id);
	}

	// Get initial nodes and edges (backward compatibility)
	getInitialNodes(): AutomationNode[] {
		// Return empty array - no default nodes anymore
		return [];
	}

	getInitialEdges(): Edge[] {
		// Return empty array - no default edges anymore  
		return [];
	}
}

// Export singleton instance
export const flowService = new FlowService(); 