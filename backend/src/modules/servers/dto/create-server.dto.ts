import { IsString, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}
