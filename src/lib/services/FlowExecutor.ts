import type { 
	AutomationNode, 
	FlowData, 
	Edge, 
	ExecutionResult, 
	FlowExecutionResult 
} from '../types/automation';

export class FlowExecutor {
	/**
	 * Perform topological sort to determine execution order
	 * Returns nodes in the order they should be executed
	 */
	private topologicalSort(nodes: AutomationNode[], edges: Edge[]): string[] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();
		
		// Initialize graph and in-degree count
		nodes.forEach(node => {
			graph.set(node.id, []);
			inDegree.set(node.id, 0);
		});
		
		// Build adjacency list and count in-degrees
		edges.forEach(edge => {
			const sourceNeighbors = graph.get(edge.source) || [];
			sourceNeighbors.push(edge.target);
			graph.set(edge.source, sourceNeighbors);
			
			const targetInDegree = inDegree.get(edge.target) || 0;
			inDegree.set(edge.target, targetInDegree + 1);
		});
		
		// Find nodes with no incoming edges (start points)
		const queue: string[] = [];
		inDegree.forEach((degree, nodeId) => {
			if (degree === 0) {
				queue.push(nodeId);
			}
		});
		
		const executionOrder: string[] = [];
		
		// Process nodes in topological order
		while (queue.length > 0) {
			const currentNode = queue.shift()!;
			executionOrder.push(currentNode);
			
			// Reduce in-degree for all neighbors
			const neighbors = graph.get(currentNode) || [];
			neighbors.forEach(neighbor => {
				const newInDegree = (inDegree.get(neighbor) || 0) - 1;
				inDegree.set(neighbor, newInDegree);
				
				// If neighbor has no more dependencies, add to queue
				if (newInDegree === 0) {
					queue.push(neighbor);
				}
			});
		}
		
		// Check for circular dependencies
		if (executionOrder.length !== nodes.length) {
			throw new Error('Circular dependency detected in workflow');
		}
		
		return executionOrder;
	}
	
	/**
	 * Get nodes that can execute in parallel (same level in topological order)
	 * Returns groups of nodes that can run simultaneously
	 */
	getParallelExecutionGroups(nodes: AutomationNode[], edges: Edge[]): string[][] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();
		
		// Initialize
		nodes.forEach(node => {
			graph.set(node.id, []);
			inDegree.set(node.id, 0);
		});
		
		// Build graph
		edges.forEach(edge => {
			const sourceNeighbors = graph.get(edge.source) || [];
			sourceNeighbors.push(edge.target);
			graph.set(edge.source, sourceNeighbors);
			
			const targetInDegree = inDegree.get(edge.target) || 0;
			inDegree.set(edge.target, targetInDegree + 1);
		});
		
		const groups: string[][] = [];
		const remaining = new Set(nodes.map(n => n.id));
		
		while (remaining.size > 0) {
			// Find all nodes with no dependencies in current iteration
			const currentGroup: string[] = [];
			
			remaining.forEach(nodeId => {
				if ((inDegree.get(nodeId) || 0) === 0) {
					currentGroup.push(nodeId);
				}
			});
			
			if (currentGroup.length === 0) {
				throw new Error('Circular dependency detected');
			}
			
			groups.push(currentGroup);
			
			// Remove processed nodes and update dependencies
			currentGroup.forEach(nodeId => {
				remaining.delete(nodeId);
				const neighbors = graph.get(nodeId) || [];
				neighbors.forEach(neighbor => {
					if (remaining.has(neighbor)) {
						const newInDegree = (inDegree.get(neighbor) || 0) - 1;
						inDegree.set(neighbor, newInDegree);
					}
				});
			});
		}
		
		return groups;
	}
	
	/**
	 * Execute a single node based on its type and configuration
	 */
	private async executeNode(node: AutomationNode, context: Map<string, any>): Promise<ExecutionResult> {
		const startTime = Date.now();
		
		try {
			console.log(`Executing node: ${node.id} (${node.category})`);
			
			let output: any;
			
			switch (node.category) {
				case 'llm':
					output = await this.executeLLMNode(node, context);
					break;
				case 'jira-create-story':
					output = await this.executeJiraCreateStory(node, context);
					break;
				case 'jira-add-comment':
					output = await this.executeJiraAddComment(node, context);
					break;
				default:
					throw new Error(`Unknown node category: ${node.category}`);
			}
			
			const duration = Date.now() - startTime;
			
			return {
				nodeId: node.id,
				success: true,
				output,
				duration
			};
			
		} catch (error) {
			const duration = Date.now() - startTime;
			
			return {
				nodeId: node.id,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration
			};
		}
	}
	
	/**
	 * Execute LLM node
	 */
	private async executeLLMNode(node: AutomationNode, context: Map<string, any>): Promise<any> {
		const config = node.data.config || {};
		const prompt = this.substituteVariables(config.prompt || '', context);
		
		// Simulate LLM API call
		console.log(`LLM Request: ${prompt}`);
		
		// Mock response - replace with actual API call
		const response = `Generated response for: ${prompt}`;
		
		// Store result in context for other nodes
		context.set(`${node.id}.response`, response);
		context.set('llm.response', response); // Global LLM response
		
		return { response, prompt };
	}
	
	/**
	 * Execute JIRA create story node
	 */
	private async executeJiraCreateStory(node: AutomationNode, context: Map<string, any>): Promise<any> {
		const config = node.data.config || {};
		const summary = this.substituteVariables(config.summary || '', context);
		const description = this.substituteVariables(config.description || '', context);
		
		// Simulate JIRA API call
		console.log(`Creating JIRA story: ${summary}`);
		
		// Mock response - replace with actual JIRA API call
		const storyId = `DEMO-${Math.floor(Math.random() * 1000)}`;
		
		context.set(`${node.id}.storyId`, storyId);
		
		return { storyId, summary, description };
	}
	
	/**
	 * Execute JIRA add comment node
	 */
	private async executeJiraAddComment(node: AutomationNode, context: Map<string, any>): Promise<any> {
		const config = node.data.config || {};
		const comment = this.substituteVariables(config.comment || '', context);
		const storyId = this.substituteVariables(config.storyId || '', context);
		
		console.log(`Adding comment to ${storyId}: ${comment}`);
		
		return { commentId: `comment-${Date.now()}`, storyId, comment };
	}
	
	/**
	 * Substitute variables in text (e.g., {{llm.response}})
	 */
	private substituteVariables(text: string, context: Map<string, any>): string {
		return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
			const value = context.get(variable.trim());
			return value !== undefined ? String(value) : match;
		});
	}
	
	/**
	 * Execute entire flow using topological sort
	 */
	async executeFlow(flow: FlowData): Promise<FlowExecutionResult> {
		const startTime = Date.now();
		const context = new Map<string, any>();
		const results: ExecutionResult[] = [];
		
		try {
			// Get execution order using topological sort
			const executionOrder = this.topologicalSort(flow.nodes, flow.edges);
			console.log('Execution order:', executionOrder);
			
			// Execute nodes in order
			for (const nodeId of executionOrder) {
				const node = flow.nodes.find(n => n.id === nodeId);
				if (!node) {
					throw new Error(`Node ${nodeId} not found`);
				}
				
				const result = await this.executeNode(node, context);
				results.push(result);
				
				if (!result.success) {
					// Stop execution on error (you could make this configurable)
					console.error(`Node ${nodeId} failed:`, result.error);
					break;
				}
			}
			
			const totalDuration = Date.now() - startTime;
			const success = results.every(r => r.success);
			
			return {
				flowId: flow.id,
				success,
				results,
				totalDuration,
				executionOrder
			};
			
		} catch (error) {
			const totalDuration = Date.now() - startTime;
			
			return {
				flowId: flow.id,
				success: false,
				results,
				totalDuration,
				executionOrder: []
			};
		}
	}
	
	/**
	 * Execute flow with parallel execution where possible
	 */
	async executeFlowParallel(flow: FlowData): Promise<FlowExecutionResult> {
		const startTime = Date.now();
		const context = new Map<string, any>();
		const results: ExecutionResult[] = [];
		
		try {
			// Get parallel execution groups
			const groups = this.getParallelExecutionGroups(flow.nodes, flow.edges);
			console.log('Parallel execution groups:', groups);
			
			const executionOrder: string[] = [];
			
			// Execute each group in parallel
			for (const group of groups) {
				const groupPromises = group.map(async nodeId => {
					const node = flow.nodes.find(n => n.id === nodeId);
					if (!node) {
						throw new Error(`Node ${nodeId} not found`);
					}
					
					return await this.executeNode(node, context);
				});
				
				const groupResults = await Promise.all(groupPromises);
				results.push(...groupResults);
				executionOrder.push(...group);
				
				// Check if any node in the group failed
				const groupFailed = groupResults.some(r => !r.success);
				if (groupFailed) {
					console.error('Group execution failed');
					break;
				}
			}
			
			const totalDuration = Date.now() - startTime;
			const success = results.every(r => r.success);
			
			return {
				flowId: flow.id,
				success,
				results,
				totalDuration,
				executionOrder
			};
			
		} catch (error) {
			const totalDuration = Date.now() - startTime;
			
			return {
				flowId: flow.id,
				success: false,
				results,
				totalDuration,
				executionOrder: []
			};
		}
	}
}

// Export singleton instance
export const flowExecutor = new FlowExecutor(); 