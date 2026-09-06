import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @IsOptional() @IsString() @MaxLength(160) companyName?: string;
  @IsString() @MinLength(2) @MaxLength(120) contactName!: string;
  @IsEmail() @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(60) phone?: string;
  @IsString() @MaxLength(120) projectType!: string;
  // Multipart form fields are flat strings, so the client sends `stack` as a
  // JSON array. Plain JSON posts still work unchanged.
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map((v: string) => v.trim()).filter(Boolean);
    }
  })
  @IsArray()
  @IsString({ each: true })
  stack?: string[];

  @IsString() @MaxLength(80) budgetRange!: string;
  @IsString() @MaxLength(80) timeline!: string;
  @IsString() @MinLength(20) @MaxLength(5000) description!: string;
}

export class UpdateOrderDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(5000) internalNotes?: string;
}
