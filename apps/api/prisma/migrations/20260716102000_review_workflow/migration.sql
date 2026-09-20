-- CreateEnum
CREATE TYPE "ReviewRequestStatus" AS ENUM ('pending', 'approved', 'changes_requested', 'cancelled');

-- CreateEnum
CREATE TYPE "ReviewActionType" AS ENUM ('assign', 'comment', 'approve', 'request_changes', 'cancel');

-- CreateTable
CREATE TABLE "review_requests" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "assigned_reviewer_id" UUID,
    "status" "ReviewRequestStatus" NOT NULL DEFAULT 'pending',
    "submit_message" TEXT,
    "due_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_actions" (
    "id" UUID NOT NULL,
    "review_request_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" "ReviewActionType" NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_requests_content_id_status_idx" ON "review_requests"("content_id", "status");
CREATE INDEX "review_requests_version_id_idx" ON "review_requests"("version_id");
CREATE INDEX "review_requests_assigned_reviewer_id_status_idx" ON "review_requests"("assigned_reviewer_id", "status");
CREATE INDEX "review_actions_review_request_id_created_at_idx" ON "review_actions"("review_request_id", "created_at");
CREATE INDEX "review_actions_actor_id_idx" ON "review_actions"("actor_id");
CREATE UNIQUE INDEX "review_requests_one_pending_per_version" ON "review_requests"("version_id") WHERE "status" = 'pending';

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_review_request_id_fkey" FOREIGN KEY ("review_request_id") REFERENCES "review_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
