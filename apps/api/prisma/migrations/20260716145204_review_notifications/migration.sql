-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_type" VARCHAR(100),
    "related_entity_id" UUID,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "status" "NotificationStatus" NOT NULL DEFAULT 'sent',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_receiver_id_read_at_created_at_idx" ON "notifications"("receiver_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_related_entity_type_related_entity_id_idx" ON "notifications"("related_entity_type", "related_entity_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
