-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('CTO', 'FRONTEND', 'BACKEND', 'DEVOPS');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationPosition" AS ENUM ('FRONTEND', 'BACKEND', 'DEVOPS', 'AI_ENGINEER', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "years_experience" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "avatar_url" TEXT,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "domain" TEXT NOT NULL,
    "stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_name" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role_on_project" TEXT NOT NULL,
    "allocation" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_orders" (
    "id" TEXT NOT NULL,
    "company_name" TEXT,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "project_type" TEXT NOT NULL,
    "stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget_range" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_applications" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "position" "ApplicationPosition" NOT NULL,
    "years_experience" INTEGER NOT NULL,
    "primary_stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "portfolio_url" TEXT,
    "github_url" TEXT,
    "motivation" TEXT NOT NULL,
    "idea_pitch" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "country" TEXT,
    "country_code" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_members_active_sort_order_idx" ON "team_members"("active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_status_featured_idx" ON "projects"("status", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_project_id_member_id_key" ON "project_assignments"("project_id", "member_id");

-- CreateIndex
CREATE INDEX "project_orders_status_created_at_idx" ON "project_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "join_applications_status_created_at_idx" ON "join_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "visits_created_at_idx" ON "visits"("created_at");

-- CreateIndex
CREATE INDEX "visits_country_code_idx" ON "visits"("country_code");

-- CreateIndex
CREATE INDEX "visits_session_id_idx" ON "visits"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
