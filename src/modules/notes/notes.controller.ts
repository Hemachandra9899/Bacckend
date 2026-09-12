import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NotesService } from './notes.service';
import { AiService } from '../ai/ai.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { GetAllNotesDto } from './dto/get-all-notes.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('api')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Main conversational chat endpoint for modern frontends
   * Returns AI answer, detected intent, structured project cards, and social links
   */
  @Post('chat')
  async chat(@Body() chatDto: ChatDto, @Res() res: Response) {
    const result = await this.notesService.searchNotes(
      chatDto.message,
      chatDto.history,
    );
    return res.json(result);
  }

  @Post(['note', 'notes'])
  async createNote(@Body() createNoteDto: CreateNoteDto, @Res() res: Response) {
    const result = await this.notesService.createNote(createNoteDto);
    return res.status(HttpStatus.CREATED).json(result);
  }

  /**
   * GET /api/getnotes supports both legacy text/plain and rich JSON with project cards
   */
  @Get('getnotes')
  async searchNotes(
    @Query() searchNotesDto: SearchNotesDto,
    @Query('format') format: string,
    @Headers('accept') acceptHeader: string,
    @Res() res: Response,
  ) {
    const result = await this.notesService.searchNotes(searchNotesDto.query);

    if (format === 'text' || acceptHeader === 'text/plain') {
      res.setHeader('Content-Type', 'text/plain');
      return res.send(result.answer);
    }

    return res.json(result);
  }

  @Get('notes')
  async getAllNotes(
    @Query() getAllNotesDto: GetAllNotesDto,
    @Res() res: Response,
  ) {
    const result = await this.notesService.getAllNotes(getAllNotesDto.limit);
    return res.json(result);
  }

  @Delete('notes/:id')
  async deleteNote(@Param('id') id: string, @Res() res: Response) {
    const result = await this.notesService.deleteNote(id);
    return res.json(result);
  }

  @Get('models')
  async getModels(@Res() res: Response) {
    const models = await this.aiService.fetchAvailableModels();
    return res.json({
      success: true,
      count: models.length,
      models,
    });
  }

  /**
   * Seeds all resume chunks and projects into Pinecone vector store
   */
  @Post('seed')
  async seedPinecone(@Res() res: Response) {
    try {
      const result = await this.notesService.seedResumeToPinecone();
      return res.json(result);
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Failed to seed Pinecone: ${error.message}`,
      });
    }
  }
}
