export interface ExecuteTask {
  id: string;
  type: string;
  inputs?: Record<string, any>;
  data?: Record<string, any>;
}

export interface ExecuteTaskResult {
  id: string;
  success: boolean;
  output?: any;
  error?: string;
  duration?: number;
}

export interface ExecuteResponse {
  results: ExecuteTaskResult[];
}

export class ExecutionClientError extends Error {
  public status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ExecutionClientError';
    this.status = status;
  }
}

export class ExecutionClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8080/api', timeout: number = 60000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  async execute(tasks: ExecuteTask[]): Promise<ExecuteResponse> {
    const url = `${this.baseUrl}/execute`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(tasks),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {}
        throw new ExecutionClientError(message, response.status);
      }

      const json = await response.json();
      const results = Array.isArray(json) ? json : json.results;
      return { results };
    } catch (error) {
      if (error instanceof ExecutionClientError) throw error;
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ExecutionClientError('Execute request timeout', 408);
        }
        throw new ExecutionClientError(`Network error: ${error.message}`);
      }
      throw new ExecutionClientError('Unknown error occurred');
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

export const executionClient = new ExecutionClient();


