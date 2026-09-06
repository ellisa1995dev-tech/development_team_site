import type { TeamMember, Project } from './types';

/** Single source of truth for headline numbers used across the marketing pages. */
export const TEAM_FACTS = {
  yearsTogether: 6,
  aiSince: 2021,
  headcount: 8,
  breakdown: { frontend: 2, backend: 4, devops: 1, cto: 1 },
  coreStack: ['Rust', 'Next.js', 'NestJS'],
};

export const SERVICES = [
  {
    slug: 'ai-product-engineering',
    title: 'AI Product Engineering',
    tagline: 'From prototype to a system that holds up under load.',
    description:
      'We have been shipping AI into production since 2021 — retrieval pipelines, inference gateways, agent workflows and the evaluation harnesses that keep quality measurable rather than anecdotal.',
    deliverables: [
      'RAG and retrieval systems with citation-level traceability',
      'Model-serving gateways with routing, batching and cost metering',
      'Evaluation harnesses and regression suites for model behaviour',
      'Human-in-the-loop review tooling',
    ],
    stack: ['Rust', 'Python', 'NestJS', 'pgvector', 'PostgreSQL'],
  },
  {
    slug: 'high-performance-backends',
    title: 'High-Performance Backends',
    tagline: 'Rust where it matters, NestJS where it moves faster.',
    description:
      'We pick the language per layer rather than per fashion. Rust carries the hot paths — gateways, pipelines, schedulers. NestJS carries the domain logic, where velocity and clarity win.',
    deliverables: [
      'Rust services on Tokio and Axum for latency-critical paths',
      'NestJS domain APIs with rigorous PostgreSQL modelling',
      'Event-driven integration with idempotency guarantees',
      'Load testing and p99 latency budgets you can hold us to',
    ],
    stack: ['Rust', 'Tokio', 'NestJS', 'PostgreSQL', 'Kafka', 'Redis'],
  },
  {
    slug: 'product-interfaces',
    title: 'Product Interfaces',
    tagline: 'Next.js front ends that stay fast on a mid-range phone.',
    description:
      'Data-dense consoles, dashboards and marketing surfaces built on the Next.js App Router — accessible by default, responsive by default, and measured against real device budgets.',
    deliverables: [
      'Next.js App Router applications with server-first data flow',
      'Design systems and shared component libraries',
      'Real-time and streaming interfaces',
      'WCAG 2.2 AA accessibility and Core Web Vitals budgets',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
  },
  {
    slug: 'platform-and-delivery',
    title: 'Platform & Delivery',
    tagline: 'Infrastructure nobody has to be afraid of.',
    description:
      'Kubernetes, Terraform and CI/CD set up so that deploying is boring — including GPU node pools for teams running their own models.',
    deliverables: [
      'Kubernetes platforms with GPU scheduling',
      'Terraform-managed infrastructure, reviewed like application code',
      'CI/CD pipelines with progressive delivery',
      'Observability: metrics, traces and alerts that mean something',
    ],
    stack: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'Prometheus'],
  },
];

export const ENGAGEMENT_MODELS = [
  {
    title: 'Full product build',
    description: 'The whole team, end to end — discovery through launch and the first months of operation.',
    fit: 'New platforms, AI products going from pilot to production.',
  },
  {
    title: 'Embedded squad',
    description: 'Two to four of our engineers join your existing team and ship inside your process.',
    fit: 'In-house teams that need senior depth in Rust, Next.js or NestJS.',
  },
  {
    title: 'Architecture engagement',
    description: 'A short, focused review of an existing system with a written plan you can act on.',
    fit: 'Scaling pain, latency problems, or a rewrite decision you want a second opinion on.',
  },
];

export const OPEN_ROLES = [
  {
    title: 'Senior Rust Engineer',
    position: 'BACKEND' as const,
    level: '7+ years',
    summary: 'Own hot-path services: inference gateways, streaming pipelines, schedulers.',
    musts: ['Production Rust at scale', 'Async runtimes (Tokio)', 'Comfort with systems-level debugging'],
  },
  {
    title: 'Senior NestJS Engineer',
    position: 'BACKEND' as const,
    level: '7+ years',
    summary: 'Domain services, PostgreSQL modelling and integrations that never double-charge anyone.',
    musts: ['Deep NestJS / TypeScript', 'Strong relational modelling', 'Testing as a default habit'],
  },
  {
    title: 'Senior Next.js Engineer',
    position: 'FRONTEND' as const,
    level: '7+ years',
    summary: 'Data-dense product interfaces built server-first, accessible and quick on real devices.',
    musts: ['Next.js App Router in production', 'Accessibility fluency', 'Performance instincts'],
  },
  {
    title: 'AI / Retrieval Engineer',
    position: 'AI_ENGINEER' as const,
    level: '7+ years',
    summary: 'Retrieval quality, evaluation harnesses and the pipeline work that makes them possible.',
    musts: ['RAG systems in production', 'Rigorous evaluation practice', 'Python plus Rust or TypeScript'],
  },
];

export const PROJECT_TYPES = [
  'AI / LLM product',
  'Retrieval or search system',
  'Backend platform or API',
  'Web application',
  'Data or analytics platform',
  'Infrastructure / DevOps',
  'Architecture review',
  'Something else',
];

export const BUDGET_RANGES = ['Under 25k', '25k - 75k', '75k - 150k', '150k - 400k', '400k+', 'Not sure yet'];

export const TIMELINES = ['ASAP', 'Within 1 month', '1 - 3 months', '3 - 6 months', 'Exploring / no date'];

export const STACK_OPTIONS = [
  'Rust',
  'Next.js',
  'NestJS',
  'TypeScript',
  'Python',
  'PostgreSQL',
  'Kubernetes',
  'AWS',
  'React',
  'GraphQL',
  'Kafka',
  'Terraform',
];

/**
 * Rendered when the API is unreachable, so the public site never shows an
 * empty team. Mirrors the seed data in apps/api/prisma/seed.ts.
 */
export const FALLBACK_MEMBERS: TeamMember[] = [
  {
    id: 'f1',
    name: 'Adrian Kovacs',
    title: 'Chief Technology Officer',
    role: 'CTO',
    yearsExperience: 15,
    focus: 'Systems architecture for large-scale AI platforms',
    bio: 'Sets the technical direction of the team and owns architecture across every engagement. Fifteen years spanning low-latency infrastructure, distributed storage and, since 2021, production AI systems.',
    skills: ['Rust', 'Distributed Systems', 'System Design', 'PostgreSQL'],
    location: 'Zurich, Switzerland',
  },
  {
    id: 'f2',
    name: 'Mira Solberg',
    title: 'Principal Backend Engineer',
    role: 'BACKEND',
    yearsExperience: 13,
    focus: 'High-throughput Rust services and inference gateways',
    bio: 'Builds the Rust core of our AI products: model-serving gateways, streaming token pipelines and the scheduling layer that keeps GPUs saturated.',
    skills: ['Rust', 'Tokio', 'Axum', 'gRPC'],
    location: 'Oslo, Norway',
  },
  {
    id: 'f3',
    name: 'Tobias Lindqvist',
    title: 'Senior Backend Engineer',
    role: 'BACKEND',
    yearsExperience: 11,
    focus: 'NestJS domain services and data modelling',
    bio: 'Owns the NestJS application layer — domain modelling, transactional integrity and the PostgreSQL schemas underneath.',
    skills: ['NestJS', 'TypeScript', 'PostgreSQL', 'Prisma'],
    location: 'Stockholm, Sweden',
  },
  {
    id: 'f4',
    name: 'Priya Raghunathan',
    title: 'Senior Backend / AI Engineer',
    role: 'BACKEND',
    yearsExperience: 10,
    focus: 'Retrieval pipelines and model evaluation harnesses',
    bio: 'Bridges the ML and backend halves of a project: embedding pipelines, vector search, retrieval quality and the harnesses that prove a change helped.',
    skills: ['Python', 'Rust', 'pgvector', 'RAG'],
    location: 'Bengaluru, India',
  },
  {
    id: 'f5',
    name: 'Marco Beneventi',
    title: 'Senior Backend Engineer',
    role: 'BACKEND',
    yearsExperience: 8,
    focus: 'Event-driven architecture and integration work',
    bio: 'Specialises in the messy edges — third-party integrations, event buses and the idempotency guarantees that keep them honest.',
    skills: ['NestJS', 'Kafka', 'Event Sourcing', 'PostgreSQL'],
    location: 'Milan, Italy',
  },
  {
    id: 'f6',
    name: 'Hannah Whitfield',
    title: 'Lead Frontend Engineer',
    role: 'FRONTEND',
    yearsExperience: 12,
    focus: 'Next.js architecture and design systems',
    bio: 'Leads the frontend practice: App Router architecture, the shared component library and the accessibility standard every screen is held to.',
    skills: ['Next.js', 'React', 'TypeScript', 'Accessibility'],
    location: 'Manchester, United Kingdom',
  },
  {
    id: 'f7',
    name: 'Kenji Nakamura',
    title: 'Senior Frontend Engineer',
    role: 'FRONTEND',
    yearsExperience: 9,
    focus: 'Data-dense interfaces and real-time visualisation',
    bio: 'Builds the dashboards, map views and streaming interfaces our AI products are judged by, with a bias toward rendering performance.',
    skills: ['Next.js', 'React', 'D3', 'WebGL'],
    location: 'Fukuoka, Japan',
  },
  {
    id: 'f8',
    name: 'Lucas Ferreira',
    title: 'Lead DevOps Engineer',
    role: 'DEVOPS',
    yearsExperience: 12,
    focus: 'Kubernetes, GPU scheduling and delivery pipelines',
    bio: 'Runs everything below the application: Kubernetes, Terraform, GPU node pools and the pipelines that get code to production several times a day.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Prometheus'],
    location: 'Lisbon, Portugal',
  },
];

export const FALLBACK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Atlas Retrieval Platform',
    slug: 'atlas-retrieval-platform',
    summary: 'Multi-tenant RAG platform serving grounded answers over 40M private documents with per-answer citations.',
    status: 'ACTIVE',
    domain: 'AI / Retrieval',
    featured: true,
    stack: ['Rust', 'NestJS', 'Next.js', 'PostgreSQL'],
    startedAt: '2024-03-11T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Northwind Inference Gateway',
    slug: 'northwind-inference-gateway',
    summary: 'Rust gateway that routes, batches and meters LLM traffic across self-hosted and vendor models.',
    status: 'ACTIVE',
    domain: 'AI / Infrastructure',
    featured: true,
    stack: ['Rust', 'Tokio', 'Redis', 'PostgreSQL'],
    startedAt: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'p3',
    name: 'Meridian Ops Console',
    slug: 'meridian-ops-console',
    summary: 'Real-time operations console with live geospatial telemetry for a fleet of 8,000 devices.',
    status: 'ACTIVE',
    domain: 'Industrial IoT',
    featured: true,
    stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Kafka'],
    startedAt: '2024-09-02T00:00:00.000Z',
  },
];

export const ROLE_LABEL: Record<string, string> = {
  CTO: 'CTO',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DEVOPS: 'DevOps',
  AI_ENGINEER: 'AI Engineer',
  OTHER: 'Other',
};
