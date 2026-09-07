import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @IsEmail() @MaxLength(200) email!: string;
  @IsString() @MinLength(8) @MaxLength(200) password!: string;
  @IsOptional() @IsString() @MaxLength(160) company?: string;
  /** Anonymous id of the in-progress sign-up, so it can be marked complete. */
  @IsOptional() @IsString() @MaxLength(64) signupSessionId?: string;
}

export class LoginUserDto {
  @IsEmail() @MaxLength(200) email!: string;
  @IsString() @MinLength(1) @MaxLength(200) password!: string;
}

export class SignupActivityDto {
  @IsString() @MinLength(1) @MaxLength(64) sessionId!: string;
}

export class CancelMembershipDto {
  /** Re-checked server-side: closing an account is irreversible. */
  @IsString() @MinLength(1) @MaxLength(200) password!: string;

  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
