import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Sse } from '@nestjs/common';
import { interval, switchMap, startWith, from, map, type Observable } from 'rxjs';
import { StatsService } from './stats.service';
import { AdminGuard } from '../auth/admin.guard';

/** All analytics is admin-only — visitor locations are not public data. */
@Controller('admin/stats')
@UseGuards(AdminGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('summary')
  summary(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.summary(this.clamp(days));
  }

  @Get('geo')
  geo(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.geo(this.clamp(days));
  }

  @Get('countries')
  countries(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.countries(this.clamp(days));
  }

  @Get('timeseries')
  timeseries(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.timeseries(this.clamp(days));
  }

  /** Registered-user counters, refreshed on demand. */
  @Get('users')
  users() {
    return this.stats.liveUsers();
  }

  /** One point per location, sized by registered users there. */
  @Get('users/geo')
  usersGeo() {
    return this.stats.usersGeo();
  }

  /**
   * Server-sent stream of the same counters, pushed every 3 seconds, so the
   * console shows registrations and in-progress sign-ups as they happen.
   * Authenticated with ?token= because EventSource cannot set headers.
   */
  @Sse('users/live')
  usersLive(): Observable<{ data: string }> {
    return interval(3000).pipe(
      startWith(0),
      switchMap(() => from(this.stats.liveUsers())),
      map((payload) => ({ data: JSON.stringify(payload) })),
    );
  }

  @Get('pages')
  pages(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.topPages(this.clamp(days));
  }

  @Get('devices')
  devices(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.stats.devices(this.clamp(days));
  }

  private clamp(days: number): number {
    if (!Number.isFinite(days) || days < 1) return 30;
    return Math.min(days, 365);
  }
}
