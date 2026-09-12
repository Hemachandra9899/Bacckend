import { IsNotEmpty, IsString } from 'class-validator';

export class SearchNotesDto {
  @IsNotEmpty({ message: 'Query parameter is required' })
  @IsString({ message: 'Query must be a string' })
  query: string;
}
