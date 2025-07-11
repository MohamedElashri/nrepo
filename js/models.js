
const models = [
    { name: "GPT-4o mini", value: "gpt-4o-mini", tokens: 128000, chars: 448000 },
    { name: "GPT-4o", value: "gpt-4o", tokens: 128000, chars: 448000 },
    { name: "GPT-4.1", value: "gpt-4.1", tokens: 1000000, chars: 3500000 },
    { name: "GPT-4.5", value: "gpt-4.5", tokens: 128000, chars: 448000 },
    { name: "OpenAI o3", value: "openai-o3", tokens: 200000, chars: 700000 },
    { name: "OpenAI o3-mini", value: "openai-o3-mini", tokens: 200000, chars: 700000 },
    { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash", tokens: 1000000, chars: 3500000 },
    { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro", tokens: 1000000, chars: 3500000 },
    { name: "Gemma 3 27b", value: "gemma-3-27b", tokens: 128000, chars: 448000 },
    // { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash", tokens: 1000000, chars: 3500000 },
    { name: "Claude 4 Opus", value: "claude-4-opus", tokens: 200000, chars: 700000 },
    { name: "Claude 4 Sonnet", value: "claude-4-sonnet", tokens: 200000, chars: 700000 },
    { name: "Claude 3.7 Sonnet", value: "claude-3.7-sonnet", tokens: 200000, chars: 700000 },
    { name: "Claude 3.5 Haiku", value: "claude-3.5-haiku", tokens: 200000, chars: 700000 },
    { name: "Claude 3.5 Sonnet", value: "claude-3.5-sonnet", tokens: 200000, chars: 700000 },
    { name: "Qwen2.5-VL-32B", value: "qwen2.5-vl-32b", tokens: 131000, chars: 458500 },
    { name: "DeepSeek-R1", value: "deepseek-r1", tokens: 128000, chars: 448000 },
    { name: "DeepSeek V3 0324", value: "deepseek-v3-0324", tokens: 128000, chars: 448000 },
    { name: "Llama 4 Scout", value: "llama-4-scout", tokens: 10000000, chars: 35000000 },
    { name: "Llama 4 Maverick", value: "llama-4-maverick", tokens: 10000000, chars: 35000000 },
    { name: "Llama 3.3 70b", value: "llama-3.3-70b", tokens: 128000, chars: 448000 },
    { name: "Llama 3.1 405b", value: "llama-3.1-405b", tokens: 128000, chars: 448000 }
];

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = models;
}
