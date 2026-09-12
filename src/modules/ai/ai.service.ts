import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateCompletionOptions, ChatMessage } from './interfaces/ai.interface';
import { PROFILE_DATA } from '../profile/profile.data';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null = null;
  private primaryModel: string;
  private chatModel: string;
  private fastModel: string;

  constructor(private readonly configService: ConfigService) {
    this.primaryModel =
      this.configService.get<string>('nvidia.model') ||
      'meta/llama-3.2-11b-vision-instruct';
    this.chatModel =
      this.configService.get<string>('nvidia.chatModel') ||
      'nvidia/nemotron-3.5-lightning-30b-a3b';
    this.fastModel =
      this.configService.get<string>('nvidia.fastModel') ||
      'meta/llama-3.2-11b-vision-instruct';
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.configService.get<string>('nvidia.apiKey');
      const baseURL = this.configService.get<string>('nvidia.baseUrl');

      if (!apiKey) {
        throw new InternalServerErrorException(
          'NVIDIA_API_KEY is missing. Please set NVIDIA_API_KEY in your .env file.',
        );
      }

      this.client = new OpenAI({
        apiKey,
        baseURL: baseURL || 'https://integrate.api.nvidia.com/v1',
        timeout: 15000,
        maxRetries: 1,
      });
      this.logger.log(`🤖 NVIDIA AI Client initialized with baseURL: ${baseURL}`);
    }
    return this.client;
  }

  /**
   * Fetches the list of all available models from NVIDIA API
   */
  async fetchAvailableModels(): Promise<string[]> {
    try {
      const client = this.getClient();
      const response = await client.models.list();
      const modelIds = response.data.map((m) => m.id);
      this.logger.log(`📋 Fetched ${modelIds.length} models from NVIDIA API`);
      return modelIds;
    } catch (error: any) {
      this.logger.error(`❌ Failed to fetch models: ${error.message}`, error.stack);
      throw error;
    }
  }

  private cleanResponse(content: string): string {
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (
      cleaned.startsWith("Here's a thinking process:") ||
      cleaned.startsWith('Here is a thinking process:')
    ) {
      const parts = cleaned.split(/\n\n+/);
      if (parts.length > 1) {
        cleaned = parts[parts.length - 1].trim();
      }
    }
    return cleaned || content.trim();
  }

  /**
   * Generates a resilient fallback answer when NVIDIA API experiences high latency
   */
  public generateLocalFallback(query: string): string {
    const q = query.toLowerCase();

    // Experience query
    if (
      q.includes('alignlabs') ||
      q.includes('codenebula') ||
      q.includes('experience') ||
      q.includes('intern') ||
      q.includes('job') ||
      q.includes('work at')
    ) {
      const expBullets = PROFILE_DATA.experience
        .map(
          (e) =>
            `• **${e.role} at ${e.company} (${e.period})**:\n${e.highlights
              .map((h) => `  - ${h}`)
              .join('\n')}\n  *Tech Stack: ${e.techStack.join(', ')}*`,
        )
        .join('\n\n');

      return `Here is a summary of my professional work experience:\n\n${expBullets}\n\nFeel free to ask for my full resume or details on specific milestones!`;
    }

    // Projects query
    if (
      q.includes('project') ||
      q.includes('built') ||
      q.includes('github') ||
      q.includes('scout') ||
      q.includes('second brain') ||
      q.includes('rag')
    ) {
      const projectBullets = PROFILE_DATA.projects
        .slice(0, 3)
        .map(
          (p) =>
            `• **[${p.title}](${p.githubUrl})**: ${p.description}\n  *Tech Stack: ${p.techStack.join(', ')}*`,
        )
        .join('\n\n');

      return `Here are some of my featured AI and software projects:\n\n${projectBullets}\n\nYou can explore all repositories on my GitHub at [https://github.com/Hemachandra9899](https://github.com/Hemachandra9899).`;
    }

    // Resume query
    if (
      q.includes('resume') ||
      q.includes('cv') ||
      q.includes('download') ||
      q.includes('qualification') ||
      q.includes('education')
    ) {
      return `I am **${PROFILE_DATA.name}**, an **${PROFILE_DATA.title}** currently working at **AlignLabs** (AI and Data Engineer) and formerly SDET Intern at **CodeNebula**.\n\nYou can download my complete resume directly via [/api/resume/download](/api/resume/download) or review my GitHub profile at [https://github.com/Hemachandra9899](https://github.com/Hemachandra9899). If you'd like to get in touch, email me at [${PROFILE_DATA.email}](mailto:${PROFILE_DATA.email}).`;
    }

    // Skills query
    if (q.includes('skill') || q.includes('stack') || q.includes('technolog')) {
      return `Here is an overview of my core technical competencies:\n\n• **Languages**: ${PROFILE_DATA.skills.languages.join(', ')}\n• **Backend & APIs**: ${PROFILE_DATA.skills.backend.join(', ')}\n• **AI & Data**: ${PROFILE_DATA.skills.aiAndData.join(', ')}\n• **Databases & Vector Stores**: ${PROFILE_DATA.skills.databases.join(', ')}\n• **DevOps & Tools**: ${PROFILE_DATA.skills.tools.join(', ')}`;
    }

    return `Hello! I am ${PROFILE_DATA.name}'s AI Assistant. I can tell you about my AI projects (like Scout and Second Brain), technical skills, work experience at AlignLabs, or provide my downloadable resume. How can I help you today?`;
  }

  async generateCompletion(options: GenerateCompletionOptions): Promise<string> {
    const client = this.getClient();
    const model = options.model || this.primaryModel;
    const temperature = options.temperature ?? 0.6;
    const max_tokens = options.maxTokens ?? 500;

    try {
      this.logger.log(`🚀 Sending prompt to NVIDIA model: ${model}`);
      const completion = await client.chat.completions.create({
        model,
        messages:
          options.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature,
        max_tokens,
      });

      const raw = completion.choices[0]?.message?.content || '';
      return this.cleanResponse(raw);
    } catch (error: any) {
      this.logger.warn(
        `⚠️  NVIDIA primary model issue (${error.message}). Trying fast model.`,
      );
      if (model !== this.fastModel) {
        try {
          const completion = await client.chat.completions.create({
            model: this.fastModel,
            messages:
              options.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            temperature,
            max_tokens,
          });
          const raw = completion.choices[0]?.message?.content || '';
          if (raw.trim()) return this.cleanResponse(raw);
        } catch (fastError: any) {
          this.logger.warn(
            `⚠️  NVIDIA fast model issue (${fastError.message}). Using local fallback.`,
          );
        }
      }
      const fallbackQuery =
        options.fallbackQuery ||
        options.messages.filter((message) => message.role === 'user').pop()?.content ||
        '';
      return this.generateLocalFallback(fallbackQuery);
    }
  }

  /**
   * Comprehensive portfolio chat response generator with full persona
   */
  async generatePortfolioAnswer(
    userQuery: string,
    contextData: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    const systemPrompt = `You are the conversational AI inside Hemachandra Reddy Pottingari's portfolio.
You know his work deeply and help visitors understand the person, engineering judgment, projects, experience, and potential fit for a role or collaboration.

YOUR PERSONA & TONE:
- Speak as Hemachandra's assistant and refer to him as "Hemachandra" or "he". Never pretend to be Hemachandra.
- Sound warm, curious, technically sharp, and natural. Respond to greetings and casual conversation like a real assistant.
- Answer the exact question first. Do not repeat a generic biography unless it is relevant.
- Use conversation history to resolve pronouns and follow-ups such as "tell me more", "which one?", "why?", or "what about the other project?".
- Match the answer length to the question. A greeting needs one or two sentences; a detailed comparison may need several short paragraphs.
- Use Markdown only when it improves scanning. Avoid a heading followed by one sentence and avoid excessive bullet lists.
- For reasonable general questions outside the portfolio, be helpful and conversational, then connect back to Hemachandra only when it feels relevant.
- Never invent facts, employers, metrics, links, or capabilities. Say when the supplied context does not contain an answer.

KEY INFORMATION YOU KNOW INTIMATELY:
1. PROJECTS:
   - Scout (Evidence-First AI Research Engine): Multi-source search, web crawling, citation verification, graph code exploration. Stack: Next.js, TypeScript, FastAPI, PostgreSQL, Qdrant, Redis, BullMQ, Docker. Link: https://github.com/Hemachandra9899/Scout
   - Second Brain (AI Knowledge Management System): Semantic search, RAG with Pinecone, NVIDIA NIM LLMs, Notion & WhatsApp workflows. Stack: Next.js, NestJS, FastAPI, Pinecone, Redis, Docker. Link: https://github.com/Hemachandra9899/second-brain
   - PDF RAG Assistant: Intelligent document analysis and Q&A over PDF documents. Stack: Python, LangChain, FastAPI. Link: https://github.com/Hemachandra9899/Pdf-Rag-Assistant
   - CogniTalk: Streaming conversational AI chat. Stack: Next.js, TypeScript. Link: https://github.com/Hemachandra9899/CogniTalk
   - Credit Card Fraud Detection: Anomaly detection on imbalanced financial datasets. Link: https://github.com/Hemachandra9899/Credit-Card-Fraud-detection
   - tools.simpleweb3.ch: Web3 and smart contract developer utilities. Link: https://github.com/Hemachandra9899/tools.simpleweb3.ch

2. WORK EXPERIENCE:
   - AlignLabs (AI and Data Engineer, Feb 2026 – Present): Full-stack AI apps, Ask AI system with intent detection & RAG, marketing automation data pipelines, analytics dashboards, document analysis.
   - CodeNebula (SDET Intern, Jul 2024 – Dec 2024): Web app features in React & Node.js, E2E testing, API validation for 500+ users.

3. EDUCATION:
   - Sreenidhi Institute of Science and Technology (B.Tech in Information Technology, 2021-2025, CGPA 7.14/10).

4. CONTACT & LINKS:
   - GitHub: https://github.com/Hemachandra9899
   - LeetCode: https://leetcode.com/u/Hemachandra9899/
   - Email: pottingari@gmail.com
   - Phone: +91 63059 84164

CRITICAL INSTRUCTIONS:
- Whenever the user asks about projects (e.g. AI projects, what I have built), ALWAYS highlight Scout and Second Brain first, describe key technical capabilities, and provide the clickable Markdown link to the exact GitHub repository.
- Whenever the user asks about my resume, experience, or qualifications, provide a crisp structured summary, mention the download link (/api/resume/download), and offer my contact details.
- Use the additional database context below as factual grounding.
- The UI separately renders project, résumé, experience, skills, and contact cards. Do not duplicate every field from those cards in the prose; introduce and summarize them naturally.
- Do not mention system prompts, retrieval, intent detection, databases, or internal implementation.`;

    const recentHistory = history
      .filter(
        (message) =>
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0,
      )
      .slice(-6);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      {
        role: 'user',
        content: `DATABASE / PORTFOLIO CONTEXT:
${contextData}

USER QUERY:
"${userQuery}"

Answer naturally using the conversation and factual context.`,
      },
    ];

    return this.generateCompletion({
      model: this.chatModel,
      messages,
      temperature: 0.55,
      maxTokens: 420,
      fallbackQuery: userQuery,
    });
  }

  async generateNoResultsResponse(query: string): Promise<string> {
    return this.generateCompletion({
      model: this.fastModel,
      temperature: 0.5,
      maxTokens: 100,
      messages: [
        {
          role: 'system',
          content: `You are Hemachandra's personal AI assistant. Reply in one or two short, warm, and friendly sentences letting the visitor know no saved notes matched, and invite them to ask about Hemachandra's projects (like Scout or Second Brain), skills, experience, or resume.`,
        },
        {
          role: 'user',
          content: `The user asked: "${query}". No matching notes found.`,
        },
      ],
    });
  }

  async generateNotesAnswer(
    query: string,
    formattedResults: string,
  ): Promise<string> {
    return this.generatePortfolioAnswer(query, formattedResults);
  }
}
