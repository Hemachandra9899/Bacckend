import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { PineconeModule } from '../pinecone/pinecone.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AiModule } from '../ai/ai.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [PineconeModule, EmbeddingsModule, AiModule, ProfileModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
