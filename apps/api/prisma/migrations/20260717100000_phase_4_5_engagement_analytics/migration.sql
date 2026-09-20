-- Phase 4: durable discovery and reuse behavior.
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id", "content_id")
);

CREATE TABLE "recent_views" (
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 1,
    "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recent_views_pkey" PRIMARY KEY ("user_id", "content_id")
);

-- Phase 5: one append-only behavior stream, search logs and administrative audit trail.
CREATE TABLE "usage_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" VARCHAR(100),
    "content_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "project_reference" VARCHAR(500),
    "source_page" VARCHAR(500),
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "keyword" VARCHAR(200) NOT NULL,
    "normalized_keyword" VARCHAR(200) NOT NULL,
    "filters" JSONB,
    "result_count" INTEGER NOT NULL,
    "clicked_content_id" UUID,
    "session_id" VARCHAR(100),
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" VARCHAR(100),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "favorites_content_id_idx" ON "favorites"("content_id");
CREATE INDEX "recent_views_user_id_last_viewed_at_idx" ON "recent_views"("user_id", "last_viewed_at");
CREATE INDEX "usage_events_organization_id_occurred_at_idx" ON "usage_events"("organization_id", "occurred_at");
CREATE INDEX "usage_events_content_id_event_type_occurred_at_idx" ON "usage_events"("content_id", "event_type", "occurred_at");
CREATE INDEX "usage_events_user_id_occurred_at_idx" ON "usage_events"("user_id", "occurred_at");
CREATE INDEX "search_logs_organization_id_searched_at_idx" ON "search_logs"("organization_id", "searched_at");
CREATE INDEX "search_logs_normalized_keyword_idx" ON "search_logs"("normalized_keyword");
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recent_views" ADD CONSTRAINT "recent_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recent_views" ADD CONSTRAINT "recent_views_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_clicked_content_id_fkey" FOREIGN KEY ("clicked_content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
