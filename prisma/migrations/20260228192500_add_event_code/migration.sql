ALTER TABLE "Event" ADD COLUMN "eventCode" TEXT;
CREATE UNIQUE INDEX "Event_eventCode_key" ON "Event"("eventCode");
