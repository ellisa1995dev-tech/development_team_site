import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString() @MaxLength(160) name!: string;
  @IsString() @MaxLength(160) slug!: string;
  @IsString() @MaxLength(500) summary!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsString() @MaxLength(120) domain!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) stack?: string[];
  @IsOptional() @IsString() @MaxLength(160) clientName?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) progress?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsDateString() startedAt!: string;
  @IsOptional() @IsDateString() completedAt?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsString() @MaxLength(120) domain?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) stack?: string[];
  @IsOptional() @IsString() @MaxLength(160) clientName?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) progress?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsDateString() startedAt?: string;
  @IsOptional() @IsDateString() completedAt?: string;
}

export class AssignMemberDto {
  @IsString() memberId!: string;
  @IsString() @MaxLength(120) roleOnProject!: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) allocation?: number;
}
