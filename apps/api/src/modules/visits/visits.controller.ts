import { Body, Controller, Post, HttpCode, Req } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { VisitsService } from './visits.service';

class TrackDto {
  @IsString()
  @MaxLength(500)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}

@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  /** Public: called once per page view by the web app. */
  @Post('track')
  @HttpCode(202)
  track(@Body() dto: TrackDto, @Req() req: Request) {
    return this.visits.track(dto, req);
  }
}
