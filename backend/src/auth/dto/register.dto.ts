import { IsEmail, IsString, IsArray, IsInt, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsArray()
  @IsString({ each: true })
  targetCompanies: string[];

  @IsString()
  preferredLanguage: string;

  @IsInt()
  daysToInterview: number;
}
