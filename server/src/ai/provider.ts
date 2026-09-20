export interface GenerateOptions {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface GenerateResult {
  text: string;
  providerUsed: 'featherless' | 'template' | 'gemini';
  errorCategory?: string;
}

let activeCalls = 0;
const MAX_CONCURRENT_CALLS = 2;

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const provider = process.env.LLM_PROVIDER || 'template';
  
  if (provider === 'template' || activeCalls >= MAX_CONCURRENT_CALLS) {
    return generateTemplate(options);
  }

  activeCalls++;
  try {
    if (provider === 'featherless') {
      return await generateFeatherless(options);
    } else {
      return generateTemplate(options);
    }
  } finally {
    activeCalls--;
  }
}

async function generateFeatherless(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL || 'Qwen/Qwen3-32B';
  const timeoutMs = options.timeoutMs || 8000;

  if (!apiKey) {
    return {
      text: "Auto-generated (template): " + fallbackText(options.user),
      providerUsed: 'template',
      errorCategory: 'missing_key'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'NAGARKAVAL'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user }
        ],
        temperature: 0.2,
        max_tokens: options.maxTokens || 400
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Featherless API error (${response.status}):`, errorText);
      return {
        text: "Auto-generated (template): " + fallbackText(options.user),
        providerUsed: 'template',
        errorCategory: response.status === 401 || response.status === 403 ? 'auth_failure' : 'api_error'
      };
    }

    const data: any = await response.json();
    let text = data.choices[0]?.message?.content || fallbackText(options.user);
    
    if (!validateResponseNumbers(options.user, text)) {
      console.warn('LLM invented numbers. Falling back.');
      text = "Auto-generated (template): " + fallbackText(options.user);
      return { text, providerUsed: 'template', errorCategory: 'hallucination' };
    }

    return {
      text,
      providerUsed: 'featherless'
    };
  } catch (error: any) {
    console.error('Featherless fetch error:', error);
    return {
      text: "Auto-generated (template): " + fallbackText(options.user),
      providerUsed: 'template',
      errorCategory: error.name === 'AbortError' ? 'timeout' : 'network_error'
    };
  }
}

function generateTemplate(options: GenerateOptions): GenerateResult {
  return {
    text: "Auto-generated (template): " + fallbackText(options.user),
    providerUsed: 'template'
  };
}

function fallbackText(prompt: string): string {
  if (prompt.includes('explain')) {
    return "The optimizer has analyzed current traffic density and wait times across all approaches. Signal timings have been adjusted to prioritize the most congested lanes while maintaining overall network throughput.";
  }
  return "Traffic analysis completed. Conditions are within expected parameters.";
}

export function getAiStatus() {
  const provider = process.env.LLM_PROVIDER || 'template';
  let configured = true;
  
  if (provider === 'featherless' && !process.env.FEATHERLESS_API_KEY) {
    configured = false;
  }
  
  return {
    provider,
    model: process.env.FEATHERLESS_MODEL || 'Qwen/Qwen3-32B',
    configured,
    lastErrorCategory: null
  };
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function validateResponseNumbers(input: string, output: string): boolean {
  const inputNums = extractNumbers(input);
  const outputNums = extractNumbers(output);
  
  for (const outNum of outputNums) {
    let found = false;
    for (const inNum of inputNums) {
      if (Math.abs(outNum - inNum) < 0.5) {
        found = true;
        break;
      }
    }
    if (!found) return false; // Found an invented number
  }
  return true;
}
