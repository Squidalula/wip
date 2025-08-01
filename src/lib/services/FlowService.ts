import type { AutomationNode, FlowData, FlowTemplate, Edge } from '../types/automation';

class FlowService {
	private flows: Map<string, FlowData> = new Map();


	private defaultFlows: FlowTemplate[] = [
		{
			id: 'empty',
			name: 'Empty Canvas',
			description: 'Start with a blank canvas',
			nodes: [],
			edges: []
		}
	];


	async getFlowTemplates(): Promise<FlowTemplate[]> {
		return this.defaultFlows;
	}


	async getFlow(id: string): Promise<FlowData | null> {

		if (this.flows.has(id)) {
			return this.flows.get(id)!;
		}


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


	async updateFlow(id: string, flow: Partial<FlowData>): Promise<FlowData> {
		const existing = this.flows.get(id);
		if (!existing) {
			throw new Error(`Flow with id ${id} not found`);
		}

		const updatedFlow: FlowData = {
			...existing,
			...flow,
			id,
			updatedAt: new Date().toISOString()
		};

		this.flows.set(id, updatedFlow);
		return updatedFlow;
	}


	async deleteFlow(id: string): Promise<void> {
		if (!this.flows.has(id)) {
			throw new Error(`Flow with id ${id} not found`);
		}
		this.flows.delete(id);
	}


	getInitialNodes(): AutomationNode[] {

		return [];
	}

	getInitialEdges(): Edge[] {
  
		return [];
	}
}


export const flowService = new FlowService(); 