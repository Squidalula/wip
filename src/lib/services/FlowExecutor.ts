import type {
    AutomationNode,
    FlowData,
    Edge,
    ExecutionResult,
    FlowExecutionResult
} from '../types/automation';
import { executionClient, type ExecuteTask } from './api/executionClient';

export class FlowExecutor {

	private topologicalSort(nodes: AutomationNode[], edges: Edge[]): string[] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();
		
	
		nodes.forEach(node => {
			graph.set(node.id, []);
			inDegree.set(node.id, 0);
		});
		
	
		edges.forEach(edge => {
			const sourceNeighbors = graph.get(edge.source) || [];
			sourceNeighbors.push(edge.target);
			graph.set(edge.source, sourceNeighbors);
			
			const targetInDegree = inDegree.get(edge.target) || 0;
			inDegree.set(edge.target, targetInDegree + 1);
		});
		
	
		const queue: string[] = [];
		inDegree.forEach((degree, nodeId) => {
			if (degree === 0) {
				queue.push(nodeId);
			}
		});
		
		const executionOrder: string[] = [];
		

		while (queue.length > 0) {
			const currentNode = queue.shift()!;
			executionOrder.push(currentNode);
			

			const neighbors = graph.get(currentNode) || [];
			neighbors.forEach(neighbor => {
				const newInDegree = (inDegree.get(neighbor) || 0) - 1;
				inDegree.set(neighbor, newInDegree);
				

				if (newInDegree === 0) {
					queue.push(neighbor);
				}
			});
		}

		// Validate and return order
		if (executionOrder.length !== nodes.length) {
			throw new Error('Circular dependency detected in workflow');
		}
		return executionOrder;
	}

	/**
     * Map internal node category to backend task type
     */
    private mapNodeCategoryToTaskType(category: string): string {
        switch (category) {
            case 'get-jira-story':
                return 'jira.getStory';
            case 'jira-create-story':
                return 'jira.createStory';
            case 'jira-add-comment':
                return 'jira.addComment';
            case 'llm':
                return 'llm.task';
            default:
                return category;
        }
    }

    /**
     * Build backend execution tasks from the current flow
     */
    private buildExecutionTasks(flow: FlowData, orderedNodeIds: string[]): ExecuteTask[] {
        const tasks: ExecuteTask[] = [];

        const getIncomingSources = (nodeId: string): string[] =>
            flow.edges.filter((e) => e.target === nodeId).map((e) => e.source);

        // Optional: read tokens/config from localStorage if present
        const jiraAccessToken = typeof window !== 'undefined' ? localStorage.getItem('jiraApiKey') || undefined : undefined;

        for (const nodeId of orderedNodeIds) {
            const node = flow.nodes.find((n) => n.id === nodeId);
            if (!node) continue;

            const inputsList = getIncomingSources(node.id);
            let inputs: Record<string, any> | undefined = undefined;
            if (inputsList.length === 1) {
                inputs = { context: inputsList[0] };
            } else if (inputsList.length > 1) {
                inputs = { context: inputsList };
            }

            const config = node.data?.config || {};
            const type = this.mapNodeCategoryToTaskType(node.category);

            let data: Record<string, any> | undefined = undefined;
            switch (node.category) {
                case 'get-jira-story':
                    data = {
                        jiraKey: config.issueKey || config.jiraKey,
                        email: 'hardcoded@example.com',
                        apiToken: jiraAccessToken,
                    };
                    break;
                case 'jira-create-story':
                    data = {
                        summary: config.summary,
                        description: config.description,
                        issueType: config.issueType,
                        priority: config.priority,
                        assignee: config.assignee,
                        accessToken: jiraAccessToken,
                    };
                    break;
                case 'jira-add-comment':
                    data = {
                        issueKey: config.issueKey || config.storyId,
                        comment: config.comment,
                        visibility: config.visibility,
                        accessToken: jiraAccessToken,
                    };
                    break;
                case 'llm':
                    data = {
                        prompt: config.prompt,
                        model: config.model,
                    };
                    break;
                default:
                    data = { ...config };
            }

            tasks.push({ id: node.id, type, inputs, data });
        }

        return tasks;
    }

    /**
     * Build a graph-shaped payload with nodes and edges for the backend
     */
    private buildGraphPayload(flow: FlowData, orderedNodeIds: string[]): {
        nodes: Array<{ id: string; type: string; inputs?: Record<string, any>; data?: Record<string, any> }>;
    } {
        const nodes = this.buildExecutionTasks(flow, orderedNodeIds).map((t) => ({
            id: t.id,
            type: t.type,
            inputs: t.inputs,
            data: t.data,
        }));
        return { nodes };
    }


	getParallelExecutionGroups(nodes: AutomationNode[], edges: Edge[]): string[][] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();
		

		nodes.forEach(node => {
			graph.set(node.id, []);
			inDegree.set(node.id, 0);
		});
		

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
            
            // Local execution is deprecated; backend handles execution.
            const output: any = {};
			
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
	
    // Legacy local execution methods retained for reference during transition, but not used
	
    private async executeJiraCreateStory() { return {}; }
	
    private async executeJiraAddComment() { return {}; }

    private async executeGetJiraStory() { return {}; }
	
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
        try {
            // Determine execution order and build tasks
            const executionOrder = this.topologicalSort(flow.nodes, flow.edges);
            // Build nodes/edges graph payload and send to backend
            const graphPayload = this.buildGraphPayload(flow, executionOrder);
            const response = await executionClient.executeGraph(graphPayload);

            // Map results
            const resultById = new Map(response.results.map((r) => [r.id, r]));
            const results: ExecutionResult[] = graphPayload.nodes.map((n) => {
                const r = resultById.get(n.id);
                return {
                    nodeId: n.id,
                    success: r?.success ?? false,
                    output: r?.output,
                    error: r?.error,
                    duration: r?.duration ?? 0,
                };
            });

            const totalDuration = Date.now() - startTime;
            const success = results.every((r) => r.success);

            return {
                flowId: flow.id,
                success,
                results,
                totalDuration,
                executionOrder,
            };
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            return {
                flowId: flow.id,
                success: false,
                results: [],
                totalDuration,
                executionOrder: [],
            };
        }
    }
	
	/**
	 * Execute flow with parallel execution where possible
	 */
	async executeFlowParallel(flow: FlowData): Promise<FlowExecutionResult> {
		// For MVP consistency, reuse the same backend execution path as executeFlow
		const startTime = Date.now();
		try {
			const executionOrder = this.topologicalSort(flow.nodes, flow.edges);
			const tasks = this.buildExecutionTasks(flow, executionOrder);
			const response = await executionClient.execute(tasks);
			const resultById = new Map(response.results.map((r) => [r.id, r]));
			const results: ExecutionResult[] = tasks.map((t) => {
				const r = resultById.get(t.id);
				return {
					nodeId: t.id,
					success: r?.success ?? false,
					output: r?.output,
					error: r?.error,
					duration: r?.duration ?? 0,
				};
			});
			return {
				flowId: flow.id,
				success: results.every((r) => r.success),
				results,
				totalDuration: Date.now() - startTime,
				executionOrder,
			};
		} catch {
			return {
				flowId: flow.id,
				success: false,
				results: [],
				totalDuration: Date.now() - startTime,
				executionOrder: [],
			};
		}
	}
}

// Export singleton instance
export const flowExecutor = new FlowExecutor(); 