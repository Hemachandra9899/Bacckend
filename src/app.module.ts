import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PineconeModule } from './modules/pinecone/pinecone.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { AiModule } from './modules/ai/ai.module';
import { NotesModule } from './modules/notes/notes.module';
import { ProfileModule } from './modules/profile/profile.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PineconeModule,
    EmbeddingsModule,
    AiModule,
    NotesModule,
    ProfileModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
