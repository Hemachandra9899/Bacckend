import { Injectable, Logger } from '@nestjs/common';
import { IEmbeddingService } from './interfaces/embedding.interface';

@Injectable()
export class EmbeddingsService implements IEmbeddingService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private pipelineInstance: any = null;
  public readonly targetDimension = 384;

  private async getPipeline() {
    if (!this.pipelineInstance) {
      this.logger.log('🔄 Loading Xenova feature-extraction model (all-MiniLM-L6-v2)...');
      const { pipeline } = await import('@xenova/transformers');
      this.pipelineInstance = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );
      this.logger.log('✅ Xenova embedding model loaded successfully (384 dims)');
    }
    return this.pipelineInstance;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Valid non-empty text input is required for embedding generation');
    }

    this.logger.log(`🔢 Generating embedding for: "${text.substring(0, 50)}..."`);
    const model = await this.getPipeline();
    const output = await model(text, {
      pooling: 'mean',
      normalize: true,
    });

    const rawEmbedding = Array.from(output.data) as number[];
    return rawEmbedding;
  }
}
