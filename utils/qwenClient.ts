import axios from 'axios';

const QWEN_SERVER_URL = 'http://100.83.133.104:1234';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class QwenClient {
  private baseURL: string;

  constructor(baseURL: string = QWEN_SERVER_URL) {
    this.baseURL = baseURL;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/completions`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Qwen server error: ${error.message}`);
      }
      throw error;
    }
  }

  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await this.chatCompletion({
      model: 'qwen3',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const qwenClient = new QwenClient();
export default QwenClient;