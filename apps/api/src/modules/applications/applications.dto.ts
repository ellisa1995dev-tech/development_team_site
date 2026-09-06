import { IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApplicationPosition, ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @IsEmail() @MaxLength(200) email!: string;
  @IsEnum(ApplicationPosition) position!: ApplicationPosition;
  @IsInt() @Min(0) @Max(60) yearsExperience!: number;
  @IsOptional() @IsArray() @IsString({ each: true }) primaryStack?: string[];
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MaxLength(500) portfolioUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) githubUrl?: string;
  @IsString() @MinLength(20) @MaxLength(5000) motivation!: string;
  @IsOptional() @IsString() @MaxLength(5000) ideaPitch?: string;
}

export class UpdateApplicationDto {
  @IsOptional() @IsEnum(ApplicationStatus) status?: ApplicationStatus;
  @IsOptional() @IsString() @MaxLength(5000) internalNotes?: string;
}
