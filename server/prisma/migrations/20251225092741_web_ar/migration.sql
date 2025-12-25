-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "modelUrl" TEXT NOT NULL,
    "usdzUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_key" ON "items"("slug");

-- CreateIndex
CREATE INDEX "items_merchantId_idx" ON "items"("merchantId");

-- CreateIndex
CREATE INDEX "items_slug_idx" ON "items"("slug");

-- CreateIndex
CREATE INDEX "scan_events_itemId_idx" ON "scan_events"("itemId");

-- CreateIndex
CREATE INDEX "scan_events_sessionId_idx" ON "scan_events"("sessionId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
