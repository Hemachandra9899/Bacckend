import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ChatMessage } from '../../ai/interfaces/ai.interface';

export class ChatDto {
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString({ message: 'Message must be a string' })
  message: string;

  @IsOptional()
  @IsArray()
  history?: ChatMessage[];
}
