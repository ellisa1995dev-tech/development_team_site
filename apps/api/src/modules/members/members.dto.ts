import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class CreateMemberDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(160) title!: string;
  @IsEnum(MemberRole) role!: MemberRole;
  @IsInt() @Min(0) yearsExperience!: number;
  @IsString() @MaxLength(2000) bio!: string;
  @IsString() @MaxLength(240) focus!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) githubUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) linkedinUrl?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateMemberDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsEnum(MemberRole) role?: MemberRole;
  @IsOptional() @IsInt() @Min(0) yearsExperience?: number;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsString() @MaxLength(240) focus?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) githubUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) linkedinUrl?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}
