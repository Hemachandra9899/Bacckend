import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PdfGeneratorService],
  exports: [ProfileService, PdfGeneratorService],
})
export class ProfileModule {}
