/* eslint-disable no-console */
import { PrismaClient, MemberRole, ProjectStatus } from '@prisma/client';
import type { TeamMember, Project } from '@prisma/client';

const prisma = new PrismaClient();

// Placeholder roster — swap names, bios and links for the real ones.
// Every engineer carries at least 7 years of individual experience.
const members = [
  {
    name: 'Adrian Kovacs',
    title: 'Chief Technology Officer',
    role: MemberRole.CTO,
    yearsExperience: 15,
    focus: 'Systems architecture for large-scale AI platforms',
    bio: 'Sets the technical direction of the team and owns architecture across every engagement. Fifteen years spanning low-latency trading infrastructure, distributed storage and, since 2021, production AI systems. Writes Rust daily and reviews every design document that leaves the team.',
    skills: ['Rust', 'Distributed Systems', 'System Design', 'PostgreSQL', 'LLM Infrastructure', 'Technical Strategy'],
    location: 'Zurich, Switzerland',
    sortOrder: 1,
  },
  {
    name: 'Mira Solberg',
    title: 'Principal Backend Engineer',
    role: MemberRole.BACKEND,
    yearsExperience: 13,
    focus: 'High-throughput Rust services and inference gateways',
    bio: 'Builds the Rust core of our AI products: model-serving gateways, streaming token pipelines and the scheduling layer that keeps GPUs saturated. Long history with Tokio and Axum, and a habit of turning p99 latency graphs into flat lines.',
    skills: ['Rust', 'Tokio', 'Axum', 'gRPC', 'Redis', 'Observability'],
    location: 'Oslo, Norway',
    sortOrder: 2,
  },
  {
    name: 'Tobias Lindqvist',
    title: 'Senior Backend Engineer',
    role: MemberRole.BACKEND,
    yearsExperience: 11,
    focus: 'NestJS domain services and data modelling',
    bio: 'Owns the NestJS application layer — domain modelling, transactional integrity and the PostgreSQL schemas underneath. Eleven years of API work across fintech and logistics, and the person who makes sure a migration never surprises anyone on a Friday.',
    skills: ['NestJS', 'TypeScript', 'PostgreSQL', 'Prisma', 'Domain-Driven Design', 'REST & GraphQL'],
    location: 'Stockholm, Sweden',
    sortOrder: 3,
  },
  {
    name: 'Priya Raghunathan',
    title: 'Senior Backend / AI Engineer',
    role: MemberRole.BACKEND,
    yearsExperience: 10,
    focus: 'Retrieval pipelines and model evaluation harnesses',
    bio: 'Bridges the ML and backend halves of a project: embedding pipelines, vector search, retrieval quality and the evaluation harnesses that prove a change actually helped. Has shipped RAG systems into regulated environments where every answer needs a citation.',
    skills: ['Python', 'Rust', 'pgvector', 'RAG', 'Model Evaluation', 'NestJS'],
    location: 'Bengaluru, India',
    sortOrder: 4,
  },
  {
    name: 'Marco Beneventi',
    title: 'Senior Backend Engineer',
    role: MemberRole.BACKEND,
    yearsExperience: 8,
    focus: 'Event-driven architecture and integration work',
    bio: 'Specialises in the messy edges — third-party integrations, event buses and the idempotency guarantees that keep them honest. Eight years of NestJS and Kafka, and the calm voice during an incident review.',
    skills: ['NestJS', 'Kafka', 'Event Sourcing', 'PostgreSQL', 'TypeScript', 'Integration Testing'],
    location: 'Milan, Italy',
    sortOrder: 5,
  },
  {
    name: 'Hannah Whitfield',
    title: 'Lead Frontend Engineer',
    role: MemberRole.FRONTEND,
    yearsExperience: 12,
    focus: 'Next.js architecture and design systems',
    bio: 'Leads the frontend practice: App Router architecture, the shared component library and the accessibility standard every screen is held to. Twelve years of product engineering, half of it building interfaces that stay fast on a mid-range phone.',
    skills: ['Next.js', 'React', 'TypeScript', 'Design Systems', 'Accessibility', 'Tailwind CSS'],
    location: 'Manchester, United Kingdom',
    sortOrder: 6,
  },
  {
    name: 'Kenji Nakamura',
    title: 'Senior Frontend Engineer',
    role: MemberRole.FRONTEND,
    yearsExperience: 9,
    focus: 'Data-dense interfaces and real-time visualisation',
    bio: 'Builds the dashboards, map views and streaming interfaces our AI products are judged by. Nine years of frontend work with a bias toward rendering performance — WebGL when it earns its place, plain SVG when it does not.',
    skills: ['Next.js', 'React', 'D3', 'WebGL', 'Streaming UI', 'Performance'],
    location: 'Fukuoka, Japan',
    sortOrder: 7,
  },
  {
    name: 'Lucas Ferreira',
    title: 'Lead DevOps Engineer',
    role: MemberRole.DEVOPS,
    yearsExperience: 12,
    focus: 'Kubernetes, GPU scheduling and delivery pipelines',
    bio: 'Runs everything below the application: Kubernetes, Terraform, GPU node pools and the CI/CD pipelines that get code to production several times a day. Twelve years of platform work, and an allergy to infrastructure that only one person understands.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'GPU Orchestration', 'Prometheus'],
    location: 'Lisbon, Portugal',
    sortOrder: 8,
  },
];

const projects = [
  {
    name: 'Atlas Retrieval Platform',
    slug: 'atlas-retrieval-platform',
    summary: 'Multi-tenant RAG platform serving grounded answers over 40M private documents with per-answer citations.',
    description:
      'Rust ingestion and embedding pipeline, pgvector-backed retrieval, NestJS control plane and a Next.js console. Sustains sub-400ms p95 retrieval at 1,200 QPS.',
    status: ProjectStatus.ACTIVE,
    domain: 'AI / Retrieval',
    stack: ['Rust', 'NestJS', 'Next.js', 'PostgreSQL', 'pgvector', 'Kubernetes'],
    clientName: 'Confidential — enterprise legal',
    progress: 72,
    featured: true,
    startedAt: new Date('2024-03-11'),
  },
  {
    name: 'Northwind Inference Gateway',
    slug: 'northwind-inference-gateway',
    summary: 'Rust gateway that routes, batches and meters LLM traffic across self-hosted and vendor models.',
    description:
      'Token-level streaming, per-tenant quotas, automatic failover between model backends and a cost ledger accurate to the request.',
    status: ProjectStatus.ACTIVE,
    domain: 'AI / Infrastructure',
    stack: ['Rust', 'Tokio', 'Redis', 'PostgreSQL', 'Prometheus'],
    clientName: 'Confidential — health tech',
    progress: 55,
    featured: true,
    startedAt: new Date('2025-01-20'),
  },
  {
    name: 'Meridian Ops Console',
    slug: 'meridian-ops-console',
    summary: 'Real-time operations console with live geospatial telemetry for a fleet of 8,000 devices.',
    description:
      'Next.js App Router frontend over a NestJS event-sourced backend, with map-based clustering and sub-second websocket updates.',
    status: ProjectStatus.ACTIVE,
    domain: 'Industrial IoT',
    stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Kafka', 'MapLibre'],
    clientName: 'Confidential — logistics',
    progress: 88,
    featured: true,
    startedAt: new Date('2024-09-02'),
  },
  {
    name: 'Halcyon Document Intelligence',
    slug: 'halcyon-document-intelligence',
    summary:
      'Extraction pipeline turning unstructured contracts into validated structured records at 99.2% field accuracy.',
    status: ProjectStatus.COMPLETED,
    domain: 'AI / Document Processing',
    stack: ['Python', 'Rust', 'NestJS', 'PostgreSQL'],
    clientName: 'Confidential — insurance',
    progress: 100,
    featured: false,
    startedAt: new Date('2022-06-15'),
    completedAt: new Date('2023-04-28'),
  },
  {
    name: 'Vantage Forecasting Suite',
    slug: 'vantage-forecasting-suite',
    summary: 'Demand-forecasting service and analyst-facing dashboard that cut inventory write-offs by 31%.',
    status: ProjectStatus.COMPLETED,
    domain: 'AI / Forecasting',
    stack: ['Python', 'NestJS', 'Next.js', 'PostgreSQL'],
    clientName: 'Confidential — retail',
    progress: 100,
    featured: false,
    startedAt: new Date('2021-05-04'),
    completedAt: new Date('2022-02-18'),
  },
];

async function main() {
  console.log('Seeding database...');

  // No admin account is seeded. There is one account system now: register on
  // the site as normal, and put that address in ADMIN_EMAILS to unlock the
  // management overview and the admin console.
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (allowlist.length) {
    console.log(`  management access: ${allowlist.join(', ')}`);
  } else {
    console.log('  management access: ADMIN_EMAILS is empty — set it, then register/sign in with that address.');
  }

  const createdMembers: TeamMember[] = [];
  for (const m of members) {
    const existing = await prisma.teamMember.findFirst({ where: { name: m.name } });
    const record = existing
      ? await prisma.teamMember.update({ where: { id: existing.id }, data: m })
      : await prisma.teamMember.create({ data: m });
    createdMembers.push(record);
  }
  console.log(`  team members: ${createdMembers.length}`);

  const createdProjects: Project[] = [];
  for (const p of projects) {
    createdProjects.push(await prisma.project.upsert({ where: { slug: p.slug }, update: p, create: p }));
  }
  console.log(`  projects: ${createdProjects.length}`);

  const assignments: Array<[string, string, string]> = [
    ['atlas-retrieval-platform', 'Mira Solberg', 'Retrieval core'],
    ['atlas-retrieval-platform', 'Priya Raghunathan', 'Embeddings & evaluation'],
    ['atlas-retrieval-platform', 'Hannah Whitfield', 'Console frontend'],
    ['northwind-inference-gateway', 'Adrian Kovacs', 'Architecture'],
    ['northwind-inference-gateway', 'Mira Solberg', 'Gateway lead'],
    ['northwind-inference-gateway', 'Lucas Ferreira', 'GPU platform'],
    ['meridian-ops-console', 'Tobias Lindqvist', 'Backend lead'],
    ['meridian-ops-console', 'Marco Beneventi', 'Event pipeline'],
    ['meridian-ops-console', 'Kenji Nakamura', 'Frontend lead'],
  ];

  for (const [slug, memberName, roleOnProject] of assignments) {
    const project = createdProjects.find((p) => p.slug === slug);
    const member = createdMembers.find((m) => m.name === memberName);
    if (!project || !member) continue;
    await prisma.projectAssignment.upsert({
      where: { projectId_memberId: { projectId: project.id, memberId: member.id } },
      update: { roleOnProject },
      create: { projectId: project.id, memberId: member.id, roleOnProject },
    });
  }
  console.log(`  assignments: ${assignments.length}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
