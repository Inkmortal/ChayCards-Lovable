/**
 * LLM Compressor - Compress retrieved docs into minimal reminders
 * Connects to Mac Mini Qwen 70B model to compress top candidates → minimal form
 * This is the FINAL reranking/compression step after Qdrant retrieval
 */

import fetch from 'node-fetch';

const LLM_ENDPOINT = 'http://192.168.1.58:1243/v1/chat/completions';
const MODEL_NAME = 'qwen';

/**
 * System prompt for compression
 */
const COMPRESSION_SYSTEM_PROMPT = `You are a context compressor for a coding assistant. Your job is to read multiple documentation sources and compress them into the SHORTEST possible reminder format.

CRITICAL RULES:
1. Output ONLY the essential information - assume Claude Code can research details
2. Focus on WHAT EXISTS and WHERE (file:line references)
3. Call out patterns to USE and patterns to AVOID
4. Maximum 300-800 tokens output (shorter is better)
5. Use bullet points and code snippets (no fluff)
6. Your job is ALIGNMENT, not education - just prevent blank slate

OUTPUT FORMAT:
- Brief bullet points
- file:line references
- Deprecated pattern warnings
- Code snippet examples (minimal)

REMEMBER: Claude Code has research tools. Your job is to prevent:
- Creating duplicate functions
- Using deprecated patterns
- Starting from scratch when patterns exist
- Forgetting architectural decisions`;

/**
 * Compress retrieved documents into minimal reminder format
 *
 * @param {string} userPrompt - Original user prompt
 * @param {Object[]} candidates - Retrieved documents from Qdrant
 * @returns {Promise<string>} Compressed reminder content
 */
export async function compressDocuments(userPrompt, candidates) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Build candidate list with relevant info
  const candidateList = candidates.map((doc, i) => {
    const header = `[${i}] ${doc.category || 'general'}/${doc.type || 'doc'} - ${doc.title || 'Untitled'}`;
    const content = doc.text.slice(0, 1500); // Limit to ~1500 chars per doc
    return `${header}\n${content}\n`;
  }).join('\n---\n\n');

  const userMessage = `User Prompt: "${userPrompt}"

Retrieved Documents (${candidates.length} total):
${candidateList}

Task: Compress ALL relevant information into the shortest possible reminder format. Focus on what exists, where it is (file:line), and what to avoid. Be aggressive - Claude Code can research details.`;

  try {
    const response = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: COMPRESSION_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1, // Low temperature for factual compression
        max_tokens: 1000,  // Enforce brevity
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const compressed = data.choices[0].message.content;

    return compressed;

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('❌ Mac Mini LLM not reachable at', LLM_ENDPOINT);
      throw new Error('LLM server not available. Check that LLM Studio is running on Mac Mini.');
    }
    throw error;
  }
}

/**
 * Test compression with sample data
 */
async function testCompression() {
  console.log('🧪 Testing LLM compression...\n');

  const testPrompt = "How do I upload files to documents?";

  const testCandidates = [
    {
      title: "Files as Entity Properties",
      category: "storage",
      type: "pattern",
      text: `# Files as Entity Properties Pattern

**Category:** Storage
**Type:** Code Pattern

## API Usage

\`\`\`typescript
await storage.set(key, data, {
  files: [{ filename: 'doc.pdf', content: base64 }]
});
\`\`\`

## Key Points
- Files in entity metadata
- User scoping automatic
- uploadFile() at DocumentsService.ts:342

## Deprecated
❌ storage.setFile() - DO NOT USE`
    },
    {
      title: "Document Storage Implementation",
      category: "documents",
      type: "documentation",
      text: `# Document Storage

Full implementation details of document storage system.
Uses Files as Entity Properties pattern.
All documents stored with automatic user scoping.`
    }
  ];

  console.log('Input:');
  console.log(`  Prompt: "${testPrompt}"`);
  console.log(`  Candidates: ${testCandidates.length} documents`);
  console.log();

  const compressed = await compressDocuments(testPrompt, testCandidates);

  console.log('Compressed Output:');
  console.log('---');
  console.log(compressed);
  console.log('---');
  console.log(`\nToken estimate: ~${compressed.split(/\s+/).length} words`);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'test':
        await testCompression();
        break;

      case 'health':
        console.log('Checking LLM server health...');
        const healthResponse = await fetch(LLM_ENDPOINT.replace('/chat/completions', '/models'));
        if (healthResponse.ok) {
          console.log('✓ LLM server is reachable');
          const models = await healthResponse.json();
          console.log('Available models:', models.data?.map(m => m.id).join(', '));
        } else {
          console.log('❌ LLM server returned error:', healthResponse.status);
        }
        break;

      default:
        console.log('Usage: node llm-compressor.js [test|health]');
        console.log('  test   - Test compression with sample data');
        console.log('  health - Check LLM server connectivity');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { compressDocuments };
