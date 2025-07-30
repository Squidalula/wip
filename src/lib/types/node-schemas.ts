// Dynamic node configuration schema system

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'password' | 'checkbox';

export interface FormField {
	id: string;
	label: string;
	type: FieldType;
	placeholder?: string;
	required?: boolean;
	default?: any;
	options?: { value: string; label: string }[];
	validation?: {
		min?: number;
		max?: number;
		pattern?: string;
	};
	helpText?: string;
}

export interface NodeConfigSchema {
	nodeType: string;
	title: string;
	icon: any; // Lucide icon component
	iconColor: string;
	fields: FormField[];
	defaults: Record<string, any>;
}

// Node configuration registry
export const nodeSchemas: Record<string, NodeConfigSchema> = {
	llm: {
		nodeType: 'llm',
		title: 'LLM Node',
		icon: 'Bot',
		iconColor: 'text-purple-500',
		fields: [
			{
				id: 'model',
				label: 'Model',
				type: 'select',
				required: true,
				default: 'gpt-4',
				options: [
					{ value: 'gpt-4', label: 'GPT-4' },
					{ value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
					{ value: 'claude-3', label: 'Claude 3' },
					{ value: 'llama-2', label: 'Llama 2' }
				]
			},
			{
				id: 'prompt',
				label: 'Prompt',
				type: 'textarea',
				placeholder: 'Enter your prompt here...',
				required: true,
				helpText: 'Describe what you want the AI to do'
			},
			{
				id: 'temperature',
				label: 'Temperature',
				type: 'number',
				default: 0.7,
				validation: { min: 0, max: 2 },
				helpText: 'Controls randomness (0.0 = deterministic, 2.0 = very random)'
			},
			{
				id: 'maxTokens',
				label: 'Max Tokens',
				type: 'number',
				default: 1000,
				validation: { min: 1, max: 4000 },
				helpText: 'Maximum number of tokens to generate'
			}
		],
		defaults: {
			model: 'gpt-4',
			prompt: '',
			temperature: 0.7,
			maxTokens: 1000
		}
	},

	'jira-create-story': {
		nodeType: 'jira-create-story',
		title: 'Create JIRA Story',
		icon: 'Plus',
		iconColor: 'text-blue-500',
		fields: [
			{
				id: 'summary',
				label: 'Summary',
				type: 'text',
				placeholder: 'Story summary',
				required: true
			},
			{
				id: 'issueType',
				label: 'Issue Type',
				type: 'select',
				default: 'Story',
				options: [
					{ value: 'Story', label: 'Story' },
					{ value: 'Task', label: 'Task' },
					{ value: 'Bug', label: 'Bug' },
					{ value: 'Epic', label: 'Epic' }
				]
			},
			{
				id: 'priority',
				label: 'Priority',
				type: 'select',
				default: 'Medium',
				options: [
					{ value: 'Highest', label: 'Highest' },
					{ value: 'High', label: 'High' },
					{ value: 'Medium', label: 'Medium' },
					{ value: 'Low', label: 'Low' },
					{ value: 'Lowest', label: 'Lowest' }
				]
			},
			{
				id: 'description',
				label: 'Description',
				type: 'textarea',
				placeholder: 'Detailed description of the story'
			},
			{
				id: 'assignee',
				label: 'Assignee',
				type: 'text',
				placeholder: 'Username or email'
			}
		],
		defaults: {
			summary: '',
			issueType: 'Story',
			priority: 'Medium',
			description: '',
			assignee: ''
		}
	},

	'jira-add-comment': {
		nodeType: 'jira-add-comment',
		title: 'Add JIRA Comment',
		icon: 'MessageSquare',
		iconColor: 'text-green-500',
		fields: [
			{
				id: 'issueKey',
				label: 'Issue Key',
				type: 'text',
				placeholder: 'e.g., PROJ-123',
				required: true,
				helpText: 'The JIRA issue key to comment on'
			},
			{
				id: 'comment',
				label: 'Comment',
				type: 'textarea',
				placeholder: 'Enter your comment here...',
				required: true
			},
			{
				id: 'visibility',
				label: 'Visibility',
				type: 'select',
				default: 'All Users',
				options: [
					{ value: 'All Users', label: 'All Users' },
					{ value: 'Developers', label: 'Developers' },
					{ value: 'Administrators', label: 'Administrators' }
				]
			}
		],
		defaults: {
			issueKey: '',
			comment: '',
			visibility: 'All Users'
		}
	},

	'slack-message': {
		nodeType: 'slack-message',
		title: 'Send Slack Message',
		icon: 'MessageCircle',
		iconColor: 'text-green-600',
		fields: [
			{
				id: 'channel',
				label: 'Channel',
				type: 'text',
				placeholder: '#general, @username, or channel ID',
				required: true,
				helpText: 'Channel name, username, or channel ID'
			},
			{
				id: 'message',
				label: 'Message',
				type: 'textarea',
				placeholder: 'Enter your message...',
				required: true
			},
			{
				id: 'emoji',
				label: 'Emoji',
				type: 'text',
				placeholder: ':rocket:',
				helpText: 'Optional emoji to use as avatar'
			},
			{
				id: 'asUser',
				label: 'Send as User',
				type: 'checkbox',
				default: false,
				helpText: 'Send message as the authenticated user'
			}
		],
		defaults: {
			channel: '',
			message: '',
			emoji: '',
			asUser: false
		}
	},

	'database-query': {
		nodeType: 'database-query',
		title: 'Database Query',
		icon: 'Database',
		iconColor: 'text-blue-600',
		fields: [
			{
				id: 'connectionString',
				label: 'Connection String',
				type: 'password',
				placeholder: 'postgresql://user:pass@host:port/db',
				required: true,
				helpText: 'Database connection string (stored securely)'
			},
			{
				id: 'query',
				label: 'SQL Query',
				type: 'textarea',
				placeholder: 'SELECT * FROM users WHERE...',
				required: true,
				helpText: 'SQL query to execute'
			},
			{
				id: 'timeout',
				label: 'Timeout (seconds)',
				type: 'number',
				default: 30,
				validation: { min: 1, max: 300 },
				helpText: 'Query timeout in seconds'
			}
		],
		defaults: {
			connectionString: '',
			query: '',
			timeout: 30
		}
	}
};

// Helper function to get schema for a node type
export function getNodeSchema(nodeType: string): NodeConfigSchema | undefined {
	return nodeSchemas[nodeType];
}

// Helper function to register a new node schema
export function registerNodeSchema(schema: NodeConfigSchema): void {
	nodeSchemas[schema.nodeType] = schema;
}
