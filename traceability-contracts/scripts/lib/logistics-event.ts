import { createHash } from "node:crypto";

export interface LogisticsEvent {
  trackingNumber: string;
  sourceEventId: string;
  courier: string;
  eventTime: string;
  status: string;
  city: string;
  country: string;
}

export const sampleEvent: LogisticsEvent = {
  trackingNumber: "GUIA-001",
  sourceEventId: "EVT-001",
  courier: "UBER",
  eventTime: "2026-06-21T18:30:00-05:00",
  status: "PICKED_UP",
  city: "Quito",
  country: "EC",
};

export function serializeEvent(event: LogisticsEvent): string {
  return [
    event.trackingNumber,
    event.sourceEventId,
    event.courier,
    event.eventTime,
    event.status,
    event.city,
    event.country,
  ].join("|");
}

export function createEventHash(event: LogisticsEvent): string {
  const digest = createHash("sha256")
    .update(serializeEvent(event))
    .digest("hex");
  return `sha256:${digest}`;
}

export function createIdempotencyKey(event: LogisticsEvent): string {
  return `${event.courier}:${event.sourceEventId}`;
}
