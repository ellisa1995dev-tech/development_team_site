import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface GeoPoint {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  visits: number;
  uniqueVisitors: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private since(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  /**
   * One row per location, carrying both raw hits and distinct sessions.
   * Coordinates are rounded to ~1 km so nearby lookups collapse into a single
   * marker instead of a smear of overlapping dots.
   */
  async geo(days: number): Promise<GeoPoint[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        city: string | null;
        region: string | null;
        country: string | null;
        country_code: string | null;
        latitude: number;
        longitude: number;
        visits: bigint;
        unique_visitors: bigint;
      }>
    >(Prisma.sql`
      SELECT
        city,
        region,
        country,
        country_code,
        ROUND(latitude::numeric, 2)::float8  AS latitude,
        ROUND(longitude::numeric, 2)::float8 AS longitude,
        COUNT(*)                    AS visits,
        COUNT(DISTINCT session_id)  AS unique_visitors
      FROM visits
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND created_at >= ${this.since(days)}
      GROUP BY city, region, country, country_code,
               ROUND(latitude::numeric, 2), ROUND(longitude::numeric, 2)
      ORDER BY visits DESC
      LIMIT 500
    `);

    return rows.map((r) => ({
      city: r.city,
      region: r.region,
      country: r.country,
      countryCode: r.country_code,
      latitude: r.latitude,
      longitude: r.longitude,
      visits: Number(r.visits),
      uniqueVisitors: Number(r.unique_visitors),
    }));
  }

  async countries(days: number) {
    const rows = await this.prisma.$queryRaw<
      Array<{ country: string | null; country_code: string | null; visits: bigint; unique_visitors: bigint }>
    >(Prisma.sql`
      SELECT country, country_code,
             COUNT(*) AS visits,
             COUNT(DISTINCT session_id) AS unique_visitors
      FROM visits
      WHERE created_at >= ${this.since(days)} AND country IS NOT NULL
      GROUP BY country, country_code
      ORDER BY visits DESC
      LIMIT 50
    `);
    return rows.map((r) => ({
      country: r.country,
      countryCode: r.country_code,
      visits: Number(r.visits),
      uniqueVisitors: Number(r.unique_visitors),
    }));
  }

  /** Daily buckets, gap-filled so the chart has no missing days. */
  async timeseries(days: number) {
    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; visits: bigint; unique_visitors: bigint }>
    >(Prisma.sql`
      SELECT d.day::date AS day,
             COUNT(v.id) AS visits,
             COUNT(DISTINCT v.session_id) AS unique_visitors
      FROM generate_series(
             (CURRENT_DATE - ${days - 1}::int), CURRENT_DATE, '1 day'
           ) AS d(day)
      LEFT JOIN visits v
        ON v.created_at >= d.day AND v.created_at < d.day + INTERVAL '1 day'
      GROUP BY d.day
      ORDER BY d.day
    `);
    return rows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      visits: Number(r.visits),
      uniqueVisitors: Number(r.unique_visitors),
    }));
  }

  async topPages(days: number) {
    const rows = await this.prisma.visit.groupBy({
      by: ['path'],
      where: { createdAt: { gte: this.since(days) } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 15,
    });
    return rows.map((r) => ({ path: r.path, visits: r._count.path }));
  }

  async devices(days: number) {
    const rows = await this.prisma.visit.groupBy({
      by: ['device'],
      where: { createdAt: { gte: this.since(days) } },
      _count: { device: true },
    });
    return rows.map((r) => ({ device: r.device ?? 'unknown', visits: r._count.device }));
  }

  /** Everything the admin landing page needs, in one round trip. */
  async summary(days: number) {
    const since = this.since(days);

    const [
      totalVisits,
      windowVisits,
      uniqueSessions,
      countryCount,
      activeProjects,
      totalProjects,
      newOrders,
      totalOrders,
      newApplications,
      totalApplications,
      activeMembers,
    ] = await Promise.all([
      this.prisma.visit.count(),
      this.prisma.visit.count({ where: { createdAt: { gte: since } } }),
      this.prisma.visit
        .findMany({ where: { createdAt: { gte: since } }, distinct: ['sessionId'], select: { sessionId: true } })
        .then((r) => r.length),
      this.prisma.visit
        .findMany({
          where: { createdAt: { gte: since }, countryCode: { not: null } },
          distinct: ['countryCode'],
          select: { countryCode: true },
        })
        .then((r) => r.length),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count(),
      this.prisma.projectOrder.count({ where: { status: 'NEW' } }),
      this.prisma.projectOrder.count(),
      this.prisma.joinApplication.count({ where: { status: 'NEW' } }),
      this.prisma.joinApplication.count(),
      this.prisma.teamMember.count({ where: { active: true } }),
    ]);

    return {
      windowDays: days,
      visits: { total: totalVisits, window: windowVisits, uniqueVisitors: uniqueSessions, countries: countryCount },
      projects: { active: activeProjects, total: totalProjects },
      orders: { new: newOrders, total: totalOrders },
      applications: { new: newApplications, total: totalApplications },
      team: { active: activeMembers },
    };
  }
}
