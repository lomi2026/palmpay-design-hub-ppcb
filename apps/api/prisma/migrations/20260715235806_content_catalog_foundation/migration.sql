-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('DESIGN_ASSET', 'AI_SKILL', 'AI_CASE', 'AI_PROJECT');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('public', 'organization', 'team', 'restricted');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'INTERNAL_TRIAL', 'PILOT', 'VERIFIED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "TagStatus" AS ENUM ('active', 'merged', 'disabled');

-- CreateEnum
CREATE TYPE "FileAccessLevel" AS ENUM ('public', 'internal', 'restricted');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('uploading', 'ready', 'failed', 'deleted');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('content', 'version', 'review', 'ai_run');

-- CreateEnum
CREATE TYPE "AttachmentUsageType" AS ENUM ('cover', 'attachment', 'input', 'output', 'evidence');

-- CreateEnum
CREATE TYPE "DataSecurityLevel" AS ENUM ('public', 'internal', 'confidential');

-- CreateEnum
CREATE TYPE "AIProjectStage" AS ENUM ('EXPLORING', 'PENDING_EVALUATION', 'READY', 'PILOTING', 'VERIFIED', 'PAUSED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('data', 'research', 'review', 'attachment');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "ContentRelationType" AS ENUM ('related', 'uses', 'evidence_for', 'derived_from');

-- CreateTable
CREATE TABLE "contents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "category_id" UUID,
    "owner_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "current_version_id" UUID,
    "draft_version_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'organization',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "cover_file_id" UUID,
    "published_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "review_due_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "version_label" VARCHAR(50),
    "version_status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "base_version_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "body" JSONB NOT NULL,
    "change_summary" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_details" (
    "content_id" UUID NOT NULL,
    "asset_type" VARCHAR(100) NOT NULL,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scenarios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unsuitable_scenarios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "problem_statement" TEXT,
    "usage_guide" JSONB,
    "resource_links" JSONB,
    "maintenance_cycle_days" INTEGER,
    "extra_data" JSONB,

    CONSTRAINT "asset_details_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "skill_details" (
    "content_id" UUID NOT NULL,
    "applicable_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "input_requirements" JSONB,
    "output_schema" JSONB,
    "prompt_template" TEXT,
    "execution_steps" JSONB,
    "example_input" JSONB,
    "example_output" JSONB,
    "human_review_rules" JSONB,
    "limitations" TEXT,
    "recommended_models" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data_security_level" "DataSecurityLevel" NOT NULL DEFAULT 'internal',
    "prompt_version" VARCHAR(50),
    "online_executable" BOOLEAN NOT NULL DEFAULT false,
    "execution_config" JSONB,

    CONSTRAINT "skill_details_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "case_details" (
    "content_id" UUID NOT NULL,
    "background" TEXT,
    "original_process" TEXT,
    "ai_responsibilities" TEXT,
    "human_responsibilities" TEXT,
    "result_summary" TEXT,
    "metric_name" VARCHAR(100),
    "before_value" DECIMAL(18,4),
    "after_value" DECIMAL(18,4),
    "sample_size" INTEGER,
    "validation_method" TEXT,
    "limitations" TEXT,
    "related_skill_content_id" UUID,
    "related_project_content_id" UUID,

    CONSTRAINT "case_details_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "case_evidence" (
    "id" UUID NOT NULL,
    "case_content_id" UUID NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL,
    "metric_name" VARCHAR(100),
    "metric_value" DECIMAL(18,4),
    "data_source" TEXT,
    "period_start" DATE,
    "period_end" DATE,
    "sample_size" INTEGER,
    "verification_status" "EvidenceVerificationStatus" NOT NULL DEFAULT 'pending',
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "attachment_id" UUID,

    CONSTRAINT "case_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_project_details" (
    "content_id" UUID NOT NULL,
    "project_code" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(100),
    "target_value" TEXT,
    "project_stage" "AIProjectStage" NOT NULL DEFAULT 'EXPLORING',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "suggested_owner_team_id" UUID,
    "problem_statement" TEXT,
    "solution_hypothesis" TEXT,
    "expected_outcome" TEXT,
    "risk_level" VARCHAR(50),
    "evaluation_result" JSONB,
    "converted_project_ref" TEXT,

    CONSTRAINT "ai_project_details_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalized_name" VARCHAR(100) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "status" "TagStatus" NOT NULL DEFAULT 'active',
    "merged_to_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "content_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("content_id","tag_id")
);

-- CreateTable
CREATE TABLE "file_attachments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "extension" VARCHAR(30),
    "size_bytes" BIGINT NOT NULL,
    "checksum" VARCHAR(128) NOT NULL,
    "access_level" "FileAccessLevel" NOT NULL DEFAULT 'internal',
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'uploading',
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_relations" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "entity_type" "AttachmentEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "usage_type" "AttachmentUsageType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_relations" (
    "id" UUID NOT NULL,
    "source_content_id" UUID NOT NULL,
    "target_content_id" UUID NOT NULL,
    "relation_type" "ContentRelationType" NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contents_slug_key" ON "contents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "contents_current_version_id_key" ON "contents"("current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "contents_draft_version_id_key" ON "contents"("draft_version_id");

-- CreateIndex
CREATE INDEX "contents_organization_id_content_type_status_idx" ON "contents"("organization_id", "content_type", "status");

-- CreateIndex
CREATE INDEX "contents_category_id_idx" ON "contents"("category_id");

-- CreateIndex
CREATE INDEX "contents_owner_id_idx" ON "contents"("owner_id");

-- CreateIndex
CREATE INDEX "contents_team_id_idx" ON "contents"("team_id");

-- CreateIndex
CREATE INDEX "contents_published_at_idx" ON "contents"("published_at");

-- CreateIndex
CREATE INDEX "contents_updated_at_idx" ON "contents"("updated_at");

-- CreateIndex
CREATE INDEX "contents_review_due_at_idx" ON "contents"("review_due_at");

-- CreateIndex
CREATE INDEX "content_versions_base_version_id_idx" ON "content_versions"("base_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_content_id_version_number_key" ON "content_versions"("content_id", "version_number");

-- CreateIndex
CREATE INDEX "case_details_related_skill_content_id_idx" ON "case_details"("related_skill_content_id");

-- CreateIndex
CREATE INDEX "case_details_related_project_content_id_idx" ON "case_details"("related_project_content_id");

-- CreateIndex
CREATE INDEX "case_evidence_case_content_id_idx" ON "case_evidence"("case_content_id");

-- CreateIndex
CREATE INDEX "case_evidence_verified_by_idx" ON "case_evidence"("verified_by");

-- CreateIndex
CREATE INDEX "case_evidence_attachment_id_idx" ON "case_evidence"("attachment_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_project_details_project_code_key" ON "ai_project_details"("project_code");

-- CreateIndex
CREATE INDEX "ai_project_details_suggested_owner_team_id_idx" ON "ai_project_details"("suggested_owner_team_id");

-- CreateIndex
CREATE INDEX "tags_merged_to_id_idx" ON "tags"("merged_to_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_normalized_name_key" ON "tags"("organization_id", "normalized_name");

-- CreateIndex
CREATE INDEX "content_tags_tag_id_idx" ON "content_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_attachments_storage_key_key" ON "file_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "file_attachments_organization_id_upload_status_idx" ON "file_attachments"("organization_id", "upload_status");

-- CreateIndex
CREATE INDEX "file_attachments_uploaded_by_idx" ON "file_attachments"("uploaded_by");

-- CreateIndex
CREATE INDEX "attachment_relations_entity_type_entity_id_idx" ON "attachment_relations"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "attachment_relations_file_id_idx" ON "attachment_relations"("file_id");

-- CreateIndex
CREATE INDEX "content_relations_target_content_id_idx" ON "content_relations"("target_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_relations_source_content_id_target_content_id_relat_key" ON "content_relations"("source_content_id", "target_content_id", "relation_type");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "file_attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_draft_version_id_fkey" FOREIGN KEY ("draft_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_base_version_id_fkey" FOREIGN KEY ("base_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_details" ADD CONSTRAINT "asset_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_details" ADD CONSTRAINT "skill_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_details" ADD CONSTRAINT "case_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_details" ADD CONSTRAINT "case_details_related_skill_content_id_fkey" FOREIGN KEY ("related_skill_content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_details" ADD CONSTRAINT "case_details_related_project_content_id_fkey" FOREIGN KEY ("related_project_content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_case_content_id_fkey" FOREIGN KEY ("case_content_id") REFERENCES "case_details"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "file_attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_project_details" ADD CONSTRAINT "ai_project_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_project_details" ADD CONSTRAINT "ai_project_details_suggested_owner_team_id_fkey" FOREIGN KEY ("suggested_owner_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_merged_to_id_fkey" FOREIGN KEY ("merged_to_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_relations" ADD CONSTRAINT "attachment_relations_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_source_content_id_fkey" FOREIGN KEY ("source_content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_target_content_id_fkey" FOREIGN KEY ("target_content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
