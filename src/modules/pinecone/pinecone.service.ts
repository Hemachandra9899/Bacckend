import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, Index } from '@pinecone-database/pinecone';

export interface PineconeRecordMetadata {
  title: string;
  description: string;
  createdAt: string;
  [key: string]: any;
}

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: PineconeRecordMetadata;
}

@Injectable()
export class PineconeService implements OnModuleInit {
  private readonly logger = new Logger(PineconeService.name);
  private client: Pinecone | null = null;
  private pineconeIndex: Index | null = null;
  private indexName: string;

  constructor(private readonly configService: ConfigService) {
    this.indexName =
      this.configService.get<string>('pinecone.indexName') || 'portfolio-free';
  }

  async onModuleInit() {
    const apiKey = this.configService.get<string>('pinecone.apiKey');
    if (!apiKey) {
      this.logger.warn(
        '⚠️  PINECONE_API_KEY is not set. Pinecone operations will fail until an API key is provided.',
      );
      return;
    }

    try {
      this.client = new Pinecone({ apiKey });
      this.pineconeIndex = this.client.Index(this.indexName);
      await this.verifyConnection();
    } catch (err: any) {
      this.logger.error(
        `❌ Pinecone initialization failed: ${err.message}`,
        err.stack,
      );
    }
  }

  private async verifyConnection() {
    try {
      this.logger.log(`🔄 Initializing Pinecone connection to index "${this.indexName}"...`);
      const stats = await this.describeIndexStats();
      this.logger.log('✅ Pinecone connection successful!');
      this.logger.log(`📊 Index stats: Dimensions=${stats.dimension}, TotalVectors=${stats.totalRecordCount || 0}`);
      
      if (stats.dimension === 1536) {
        this.logger.warn(
          '⚠️  DIMENSION NOTICE: Your index expects 1536 dimensions. Xenova embeddings will be padded to 1536.',
        );
      }
    } catch (err: any) {
      this.logger.error(`❌ Pinecone connection check failed: ${err.message}`);
    }
  }

  getIndex(): Index {
    if (!this.pineconeIndex) {
      const apiKey = this.configService.get<string>('pinecone.apiKey');
      if (!apiKey) {
        throw new InternalServerErrorException(
          'Pinecone API key is not configured. Please set PINECONE_API_KEY in your environment.',
        );
      }
      this.client = new Pinecone({ apiKey });
      this.pineconeIndex = this.client.Index(this.indexName);
    }
    return this.pineconeIndex;
  }

  async describeIndexStats() {
    const index = this.getIndex();
    return await index.describeIndexStats();
  }

  async upsert(records: PineconeRecord[]) {
    const index = this.getIndex();
    return await index.upsert(records);
  }

  async query(options: {
    vector: number[];
    topK: number;
    includeMetadata?: boolean;
    includeValues?: boolean;
  }) {
    const index = this.getIndex();
    return await index.query(options);
  }

  async fetch(ids: string[]) {
    const index = this.getIndex();
    return await index.fetch(ids);
  }

  async deleteOne(id: string) {
    const index = this.getIndex();
    return await index.deleteOne(id);
  }
}
