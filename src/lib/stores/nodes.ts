import type { AutomationNode } from '../types/automation';

// Automation node data management
export class NodeData {
	static getInitialNodes(): AutomationNode[] {
		// Return empty array - users will add nodes as needed
		// Or load from templates via FlowService
		return [];
	}

	static getInitialEdges() {
		// Return empty array - edges will be created when users connect nodes
		return [];
	}

	static createAutomationNode(
		nodeId: string, 
		nodeType: 'trigger' | 'action' | 'logic' | 'code',
		category: string,
		position?: { x: number; y: number }
	): AutomationNode {
		const nodeConfigs = {
			// AI Nodes
			llm: { label: 'LLM Node', color: '#a855f7', description: 'AI language model processing' },
			
			// JIRA Nodes
			'jira-create-story': { label: 'Create Story', color: '#3b82f6', description: 'Create JIRA story' },
			'jira-add-comment': { label: 'Add Comment', color: '#10b981', description: 'Add JIRA comment' },
			
			// Legacy nodes for backward compatibility
			webhook: { label: 'Webhook', color: '#3b82f6', description: 'Receive HTTP requests' },
			schedule: { label: 'Schedule', color: '#10b981', description: 'Run on schedule' },
			manual: { label: 'Manual', color: '#eab308', description: 'Start manually' },
			http: { label: 'HTTP Request', color: '#a855f7', description: 'Make API calls' },
			email: { label: 'Email', color: '#ef4444', description: 'Send emails' },
			database: { label: 'Database', color: '#6366f1', description: 'Query databases' },
			if: { label: 'IF Condition', color: '#f97316', description: 'Conditional logic' },
			filter: { label: 'Filter', color: '#14b8a6', description: 'Filter data' },
			loop: { label: 'Loop', color: '#ec4899', description: 'Repeat actions' },
			javascript: { label: 'JavaScript', color: '#374151', description: 'Run custom code' }
		};

		const config = nodeConfigs[category as keyof typeof nodeConfigs] || {
			label: category,
			color: '#6b7280',
			description: 'Automation node'
		};

		const defaultPosition = position || { 
			x: Math.random() * 400 + 200, 
			y: Math.random() * 300 + 150 
		};

		return {
			id: nodeId,
			type: 'automation',
			nodeType,
			category,
			data: {
				label: config.label,
				description: config.description,
				color: config.color
			},
			position: defaultPosition,
			style: `background-color: ${config.color}; color: white; border: 2px solid ${config.color}dd; cursor: pointer; border-radius: 8px; padding: 12px; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`
		};
	}

	static createNewNode(id: string): AutomationNode {
		return this.createAutomationNode(id, 'action', 'http');
	}
}

// Re-export the AutomationNode type for convenience
export type { AutomationNode } from '../types/automation'; 