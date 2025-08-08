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
                inputs = { sources: inputsList };
            }

            const config = node.data?.config || {};
            const type = this.mapNodeCategoryToTaskType(node.category);

            let data: Record<string, any> | undefined = undefined;
            switch (node.category) {
                case 'get-jira-story':
                    data = {
                        jiraKey: config.issueKey || config.jiraKey,
                        accessToken: jiraAccessToken,
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
                        temperature: config.temperature,
                        maxTokens: config.maxTokens,
                    };
                    break;
                default:
                    data = { ...config };
            }

            tasks.push({ id: node.id, type, inputs, data });
        }

        return tasks;
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
				case 'get-jira-story':
					output = await this.executeGetJiraStory(node, context);
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
	 * Execute get JIRA story node
	 */
	private async executeGetJiraStory(node: AutomationNode, context: Map<string, any>): Promise<any> {
		const config = node.data.config || {};
		const issueKey = this.substituteVariables(config.issueKey || '', context);
		
		console.log(`Retrieving JIRA story: ${issueKey} (fetching all available data)`);
		
		// Mock response with all available data - replace with actual JIRA API call
		const mockStory = {
			key: issueKey,
			summary: `Sample story ${issueKey}`,
			description: 'This is a sample JIRA story description',
			status: 'In Progress',
			priority: 'Medium',
			assignee: 'john.doe@example.com',
			reporter: 'jane.smith@example.com',
			created: new Date().toISOString(),
			updated: new Date().toISOString(),
			dueDate: null,
			labels: ['backend', 'api'],
			components: ['Core API'],
			fixVersions: ['v2.1.0'],
			issueType: 'Story',
			storyPoints: 5,
			epic: 'PROJ-100',
			sprint: 'Sprint 23',
			comments: [
				{
					id: 'comment-1',
					author: 'jane.smith@example.com',
					body: 'This is a sample comment',
					created: new Date().toISOString()
				},
				{
					id: 'comment-2',
					author: 'john.doe@example.com',
					body: 'Working on this now',
					created: new Date().toISOString()
				}
			],
			history: [
				{
					id: 'history-1',
					author: 'john.doe@example.com',
					created: new Date().toISOString(),
					items: [
						{
							field: 'status',
							fromString: 'To Do',
							toString: 'In Progress'
						}
					]
				},
				{
					id: 'history-2',
					author: 'jane.smith@example.com',
					created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
					items: [
						{
							field: 'assignee',
							fromString: null,
							toString: 'john.doe@example.com'
						}
					]
				}
			],
			attachments: [
				{
					id: 'attachment-1',
					filename: 'requirements.pdf',
					size: 1024000,
					mimeType: 'application/pdf',
					created: new Date().toISOString()
				}
			],
			subtasks: [
				{
					key: `${issueKey}-1`,
					summary: 'Subtask 1: API endpoint',
					status: 'Done'
				},
				{
					key: `${issueKey}-2`,
					summary: 'Subtask 2: Database schema',
					status: 'In Progress'
				}
			]
		};

		// Store result in context for other nodes
		context.set(`${node.id}.story`, mockStory);
		context.set(`${node.id}.issueKey`, issueKey);
		
		return { story: mockStory, issueKey };
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
        try {
            // Determine execution order and build tasks
            const executionOrder = this.topologicalSort(flow.nodes, flow.edges);
            const tasks = this.buildExecutionTasks(flow, executionOrder);

            // Send to backend
            const response = await executionClient.execute(tasks);

            // Map results
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