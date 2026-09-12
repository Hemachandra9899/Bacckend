import { IsOptional, IsNumberString } from 'class-validator';

export class GetAllNotesDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a numeric string' })
  limit?: string;
}
