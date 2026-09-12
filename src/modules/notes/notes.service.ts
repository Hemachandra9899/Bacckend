import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PineconeService } from '../pinecone/pinecone.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AiService } from '../ai/ai.service';
import { ProfileService, UserIntent } from '../profile/profile.service';
import { ProjectItem, ProfileData } from '../profile/profile.data';
import { CreateNoteDto } from './dto/create-note.dto';
import { ChatMessage } from '../ai/interfaces/ai.interface';

export interface ResumePayload {
  downloadUrl: string;
  viewUrl: string;
  filename: string;
  name: string;
  title: string;
  summary: string;
  education: ProfileData['education'];
  experience: ProfileData['experience'];
  skills: ProfileData['skills'];
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  intent: UserIntent;
  cardType: 'projects' | 'resume' | 'experience' | 'skills' | 'contact' | 'none';
  projects?: ProjectItem[];
  resume?: ResumePayload;
  experience?: ProfileData['experience'];
  skills?: ProfileData['skills'];
  socialLinks: {
    github: string;
    leetcode: string;
    email: string;
    phone: string;
  };
}

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly pineconeService: PineconeService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly aiService: AiService,
    private readonly profileService: ProfileService,
  ) {}

  async createNote(createNoteDto: CreateNoteDto) {
    const { title, description } = createNoteDto;
    this.logger.log(`📝 Creating note with title: "${title}"`);

    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const embeddings = await this.embeddingsService.generateEmbedding(
      `${title} ${description}`,
    );

    const record = {
      id,
      values: embeddings,
      metadata: {
        title,
        description,
        createdAt: new Date().toISOString(),
      },
    };

    await this.pineconeService.upsert([record]);
    this.logger.log('✅ Pinecone upsert completed');

    return {
      success: true,
      message: 'Note saved successfully',
      note: {
        id,
        title,
        description,
      },
    };
  }

  /**
   * Universal search and answer engine combining Pinecone RAG with full profile context
   */
  async searchNotes(query: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter is required');
    }

    this.logger.log(`🔍 Processing query: "${query}"`);
    const intent = this.profileService.detectIntent(query);
    const profileContext = this.profileService.getRelevantContext(query);
    const profile = this.profileService.getProfile();

    // Profile data is already complete and structured. Avoiding embeddings and
    // a remote vector query keeps every conversational request on the fast path.
    const fullContext = profileContext;
    const answer = await this.aiService.generatePortfolioAnswer(
      query,
      fullContext,
      history,
    );

    // Determine cardType and attach payload for frontend UI components
    let cardType: 'projects' | 'resume' | 'experience' | 'skills' | 'contact' | 'none' = 'none';
    let relevantProjects: ProjectItem[] | undefined = undefined;
    let resumePayload: ResumePayload | undefined = undefined;
    let experiencePayload: ProfileData['experience'] | undefined = undefined;
    let skillsPayload: ProfileData['skills'] | undefined = undefined;

    const lowerQuery = query.toLowerCase();

    if (
      intent === 'resume' ||
      lowerQuery.includes('resume') ||
      lowerQuery.includes('cv') ||
      lowerQuery.includes('download')
    ) {
      cardType = 'resume';
      resumePayload = {
        downloadUrl: '/api/resume/download',
        viewUrl: '/api/resume/view',
        filename: 'Hemachandra_Reddy_Resume.pdf',
        name: profile.name,
        title: profile.title,
        summary: profile.summary,
        education: profile.education,
        experience: profile.experience,
        skills: profile.skills,
      };
    } else if (intent === 'projects') {
      cardType = 'projects';
      relevantProjects = this.profileService.getProjects();
    } else if (intent === 'experience') {
      cardType = 'experience';
      experiencePayload = this.profileService.getExperience();
    } else if (intent === 'skills' || lowerQuery.includes('skill') || lowerQuery.includes('stack')) {
      cardType = 'skills';
      skillsPayload = this.profileService.getSkills();
    } else if (intent === 'contact') {
      cardType = 'contact';
    }

    return {
      success: true,
      answer,
      intent,
      cardType,
      projects: relevantProjects,
      resume: resumePayload,
      experience: experiencePayload,
      skills: skillsPayload,
      socialLinks: {
        github: profile.githubUrl,
        leetcode: profile.leetcodeUrl,
        email: profile.email,
        phone: profile.phone,
      },
    };
  }

  async getAllNotes(limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    this.logger.log(`📚 Fetching up to ${limit} notes...`);

    const dummyVector = Array(384)
      .fill(0)
      .map(() => Math.random());

    const response = await this.pineconeService.query({
      vector: dummyVector,
      topK: limit,
      includeMetadata: true,
      includeValues: false,
    });

    const notes =
      response.matches?.map((match) => ({
        id: match.id,
        title: match.metadata?.title,
        description: match.metadata?.description,
        createdAt: match.metadata?.createdAt,
        score: match.score,
      })) || [];

    return {
      success: true,
      count: notes.length,
      notes,
    };
  }

  async deleteNote(id: string) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }

    this.logger.log(`🗑️ Deleting note with ID: "${id}"`);

    const fetchResponse = await this.pineconeService.fetch([id]);
    if (!fetchResponse.records || !fetchResponse.records[id]) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }

    await this.pineconeService.deleteOne(id);

    return {
      success: true,
      message: 'Note deleted successfully',
      deletedId: id,
    };
  }

  /**
   * Seeds all resume chunks and projects into Pinecone
   */
  async seedResumeToPinecone() {
    this.logger.log('🌱 Starting resume & portfolio seeding into Pinecone...');
    const seedRecords = this.profileService.getPineconeSeedRecords();
    const pineconeRecords: any[] = [];

    for (const item of seedRecords) {
      const embedding = await this.embeddingsService.generateEmbedding(item.text);
      pineconeRecords.push({
        id: item.id,
        values: embedding,
        metadata: {
          title: item.title,
          description: item.description,
          category: item.category,
          createdAt: new Date().toISOString(),
        },
      });
    }

    await this.pineconeService.upsert(pineconeRecords);
    this.logger.log(
      `✅ Successfully seeded ${pineconeRecords.length} records into Pinecone!`,
    );

    return {
      success: true,
      message: `Successfully seeded ${pineconeRecords.length} profile & project records into Pinecone`,
      count: pineconeRecords.length,
      records: seedRecords.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
      })),
    };
  }
}
