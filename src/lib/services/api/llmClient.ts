export interface LLMRequest {
	prompt: string;
	model: string;
	temperature?: number;
	maxTokens?: number;
	stream?: boolean;
}

export interface LLMResponse {
	content: string;
	model: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	finishReason?: string;
}

export interface LLMError {
	error: string;
	message: string;
	status?: number;
}

export class LLMClientError extends Error {
	public status?: number;
	
	constructor(message: string, status?: number) {
		super(message);
		this.name = 'LLMClientError';
		this.status = status;
	}
}

export class LLMClient {
	private baseUrl: string;
	private timeout: number;

	constructor(
		baseUrl: string = 'http://localhost:8080/api/llm',
		timeout: number = 30000
	) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.timeout = timeout;
	}


	async sendPrompt(request: LLMRequest): Promise<LLMResponse> {
		const url = `${this.baseUrl}/chat`;
		
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		const body = JSON.stringify({
			prompt: request.prompt,
			model: request.model,
			temperature: request.temperature ?? 0.7,
			maxTokens: request.maxTokens ?? 1000,
			stream: request.stream ?? false
		});

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.timeout);

			const response = await fetch(url, {
				method: 'POST',
				headers,
				body,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData: LLMError = await response.json().catch(() => ({
					error: 'HTTP_ERROR',
					message: `HTTP ${response.status}: ${response.statusText}`
				}));
				
				throw new LLMClientError(
					errorData.message || `Request failed with status ${response.status}`,
					response.status
				);
			}

			const data: LLMResponse = await response.json();
			return data;
		} catch (error) {
			if (error instanceof LLMClientError) {
				throw error;
			}
			
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new LLMClientError('Request timeout', 408);
				}
				throw new LLMClientError(`Network error: ${error.message}`);
			}
			
			throw new LLMClientError('Unknown error occurred');
		}
	}


	async getAvailableModels(): Promise<string[]> {
		const url = `${this.baseUrl}/models`;
		
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers
			});

			if (!response.ok) {
				throw new LLMClientError(
					`Failed to fetch models: ${response.status} ${response.statusText}`,
					response.status
				);
			}

			const models: string[] = await response.json();
			return models;
		} catch (error) {
			if (error instanceof LLMClientError) {
				throw error;
			}
			throw new LLMClientError(`Failed to fetch models: ${error}`);
		}
	}


	async streamPrompt(
		request: LLMRequest,
		onChunk: (chunk: string) => void,
		onComplete?: (response: LLMResponse) => void,
		onError?: (error: LLMClientError) => void
	): Promise<void> {
		const url = `${this.baseUrl}/chat/stream`;
		
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		const body = JSON.stringify({
			...request,
			stream: true
		});

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers,
				body
			});

			if (!response.ok) {
				const errorData: LLMError = await response.json().catch(() => ({
					error: 'HTTP_ERROR',
					message: `HTTP ${response.status}: ${response.statusText}`
				}));
				
				const error = new LLMClientError(
					errorData.message || `Request failed with status ${response.status}`,
					response.status
				);
				
				onError?.(error);
				return;
			}

			const reader = response.body?.getReader();
			if (!reader) {
				onError?.(new LLMClientError('No response body'));
				return;
			}

			const decoder = new TextDecoder();
			let fullContent = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					
					if (done) break;
					
					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split('\n');
					
					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const data = line.slice(6);
							if (data === '[DONE]') {
								onComplete?.({
									content: fullContent,
									model: request.model
								});
								return;
							}
							
							try {
								const parsed = JSON.parse(data);
								if (parsed.content) {
									fullContent += parsed.content;
									onChunk(parsed.content);
								}
							} catch (e) {

							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			const llmError = error instanceof LLMClientError 
				? error 
				: new LLMClientError(`Stream error: ${error}`);
			onError?.(llmError);
		}
	}


	updateConfig(config: { baseUrl?: string; timeout?: number }) {
		if (config.baseUrl) {
			this.baseUrl = config.baseUrl.replace(/\/$/, '');
		}
		if (config.timeout) {
			this.timeout = config.timeout;
		}
	}
}


export const llmClient = new LLMClient();


export const LLM_MODELS = {
	GPT_4: 'gpt-4',
	GPT_3_5_TURBO: 'gpt-3.5-turbo',
	CLAUDE_3_SONNET: 'claude-3-sonnet',
	CLAUDE_3_HAIKU: 'claude-3-haiku',
	LLAMA_2: 'llama-2',
	GEMINI_PRO: 'gemini-pro'
} as const;

export type LLMModel = typeof LLM_MODELS[keyof typeof LLM_MODELS]; 