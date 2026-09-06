export type MemberRole = 'CTO' | 'FRONTEND' | 'BACKEND' | 'DEVOPS';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type OrderStatus = 'NEW' | 'REVIEWING' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'ARCHIVED';
export type ApplicationPosition = 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'AI_ENGINEER' | 'OTHER';
export type ApplicationStatus = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  role: MemberRole;
  yearsExperience: number;
  bio: string;
  focus: string;
  skills: string[];
  location?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  active?: boolean;
  sortOrder?: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description?: string | null;
  status: ProjectStatus;
  domain: string;
  stack: string[];
  clientName?: string | null;
  progress?: number;
  featured: boolean;
  startedAt: string;
  completedAt?: string | null;
  assignments?: Array<{
    id: string;
    roleOnProject: string;
    member: { id: string; name: string; role: MemberRole; title: string };
  }>;
}

export interface ProjectOrder {
  id: string;
  companyName?: string | null;
  contactName: string;
  email: string;
  phone?: string | null;
  projectType: string;
  stack: string[];
  budgetRange: string;
  timeline: string;
  description: string;
  status: OrderStatus;
  internalNotes?: string | null;
  createdAt: string;
}

export interface JoinApplication {
  id: string;
  fullName: string;
  email: string;
  position: ApplicationPosition;
  yearsExperience: number;
  primaryStack: string[];
  location?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  motivation: string;
  ideaPitch?: string | null;
  status: ApplicationStatus;
  internalNotes?: string | null;
  createdAt: string;
}

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

export interface StatsSummary {
  windowDays: number;
  visits: { total: number; window: number; uniqueVisitors: number; countries: number };
  projects: { active: number; total: number };
  orders: { new: number; total: number };
  applications: { new: number; total: number };
  team: { active: number };
  users: { registered: number; onlineNow: number };
}
