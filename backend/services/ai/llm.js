const MODEL = () => process.env.LLM_MODEL || 'openai/gpt-oss-120b';

let client = null;

const llmAvailable = () => !!process.env.GROQ_API_KEY;

function getClient() {
    if (!client) {
        const Groq = require('groq-sdk');

        client = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    return client;
}

async function completeJson(system, user, maxTokens = 2000) {
    if (!llmAvailable()) return null;

    try {
        const msg = await getClient().chat.completions.create({
            model: MODEL(),

            messages: [
                {
                    role: 'system',
                    content: `${system}\nRespond with a single valid JSON object and nothing else.`
                },
                {
                    role: 'user',
                    content: user
                }
            ],

            max_tokens: maxTokens,

            response_format: {
                type: 'json_object'
            }
        });

        let text = msg.choices[0]?.message?.content?.trim() || '';

        text = text.replace(/^```(?:json)?\s*|\s*```$/g, '');

        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start === -1 || end === -1) return null;

        return JSON.parse(text.slice(start, end + 1));

    } catch (err) {
        console.error('[llm] Groq call failed, using fallback:', err.message);
        return null;
    }
}

function clamp(value, lo = 0, hi = 100, dflt = 0) {
    const n = parseFloat(value);

    if (Number.isNaN(n)) return dflt;

    return Math.max(lo, Math.min(hi, n));
}

module.exports = {
    llmAvailable,
    completeJson,
    clamp
};