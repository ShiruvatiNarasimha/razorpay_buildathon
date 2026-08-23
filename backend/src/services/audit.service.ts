import { AuditEventDTO, AuditEventType } from '../contracts/index.js';
import { prisma } from '../db/index.js';
import { createHash, randomUUID } from 'node:crypto';

export interface RecordAuditEventParams {
  eventType: AuditEventType;
  actor: string;
  paymentIntentId?: string | null;
  agentId?: string | null;
  requestId: string;
  decision?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private static inMemoryLedger: AuditEventDTO[] = [];
  private static previousChecksum: string = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Computes deterministic SHA-256 hash chaining each audit record with the previous.
   */
  public static computeChecksum(event: Omit<AuditEventDTO, 'checksum'>, previousHash: string): string {
    const payload = `${previousHash}|${event.id}|${event.eventType}|${event.actor}|${event.paymentIntentId || ''}|${event.requestId}|${event.timestamp}|${JSON.stringify(event.metadata || {})}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Records an immutable audit log entry.
   * Cryptographically links each event with the prior event's checksum.
   */
  public static async recordEvent(params: RecordAuditEventParams): Promise<AuditEventDTO> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const metadata = params.metadata || {};

    const partialEvent = {
      id,
      eventType: params.eventType,
      actor: params.actor,
      paymentIntentId: params.paymentIntentId,
      agentId: params.agentId,
      requestId: params.requestId,
      decision: params.decision,
      reason: params.reason,
      metadata,
      timestamp,
    };

    const checksum = this.computeChecksum(partialEvent, this.previousChecksum);
    this.previousChecksum = checksum;

    const event: AuditEventDTO = {
      id,
      eventType: params.eventType,
      actor: params.actor,
      paymentIntentId: params.paymentIntentId,
      agentId: params.agentId,
      requestId: params.requestId,
      decision: params.decision,
      reason: params.reason,
      metadata,
      checksum,
      timestamp,
    };

    // Store in in-memory ledger for immediate zero-delay queries
    this.inMemoryLedger.push(event);

    // Persist to PostgreSQL / Supabase if connected
    if (await this.isDbAvailable()) {
      try {
        let validPaymentIntentId: string | null = null;
        if (event.paymentIntentId) {
          const exists = await prisma.paymentIntent.findUnique({
            where: { id: event.paymentIntentId },
            select: { id: true },
          }).catch(() => null);
          if (exists) {
            validPaymentIntentId = event.paymentIntentId;
          }
        }

        await Promise.race([
          prisma.auditEvent.create({
            data: {
              id: event.id,
              paymentIntentId: validPaymentIntentId,
              eventType: event.eventType,
              actor: event.actor,
              agentId: event.agentId || null,
              requestId: event.requestId,
              decision: event.decision || null,
              reason: event.reason || null,
              metadata: event.metadata as unknown as object,
              checksum: event.checksum,
              timestamp: new Date(event.timestamp),
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Audit DB write timeout')), 400)),
        ]);
      } catch {
        // Degrades gracefully to in-memory ledger
      }
    }

    return event;
  }

  public static async getEvents(limit: number = 100): Promise<AuditEventDTO[]> {
    if (await this.isDbAvailable()) {
      try {
        const rows = await prisma.auditEvent.findMany({
          take: limit,
          orderBy: { timestamp: 'desc' },
        });

        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            eventType: r.eventType as AuditEventType,
            actor: r.actor,
            paymentIntentId: r.paymentIntentId,
            agentId: r.agentId,
            requestId: r.requestId,
            decision: r.decision,
            reason: r.reason,
            metadata: (r.metadata as Record<string, unknown>) || {},
            checksum: r.checksum || undefined,
            timestamp: r.timestamp.toISOString(),
          }));
        }
      } catch {
        // Fall back to in-memory ledger
      }
    }

    return [...this.inMemoryLedger].reverse().slice(0, limit);
  }

  public static async getEventsForIntent(paymentIntentId: string): Promise<AuditEventDTO[]> {
    const memoryMatches = this.inMemoryLedger.filter((e) => e.paymentIntentId === paymentIntentId);
    if (memoryMatches.length > 0) {
      return memoryMatches;
    }

    if (await this.isDbAvailable()) {
      try {
        const rows = await prisma.auditEvent.findMany({
          where: { paymentIntentId },
          orderBy: { timestamp: 'asc' },
        });
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            eventType: r.eventType as AuditEventType,
            actor: r.actor,
            paymentIntentId: r.paymentIntentId,
            agentId: r.agentId,
            requestId: r.requestId,
            decision: r.decision,
            reason: r.reason,
            metadata: (r.metadata as Record<string, unknown>) || {},
            checksum: r.checksum || undefined,
            timestamp: r.timestamp.toISOString(),
          }));
        }
      } catch {
        // Fall back to in-memory ledger
      }
    }

    return [];
  }

  public static verifyLedgerIntegrity(events: AuditEventDTO[]): {
    isValid: boolean;
    brokenAtEventId?: string;
  } {
    if (events.length === 0) return { isValid: true };

    let runningHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const evt of events) {
      if (!evt.checksum) return { isValid: false, brokenAtEventId: evt.id };

      const expected = this.computeChecksum(evt, runningHash);
      if (expected !== evt.checksum) {
        return { isValid: false, brokenAtEventId: evt.id };
      }
      runningHash = evt.checksum;
    }

    return { isValid: true };
  }

  public static clear(): void {
    this.inMemoryLedger = [];
    this.previousChecksum = '0000000000000000000000000000000000000000000000000000000000000000';
  }

  private static dbAvailableCache: { available: boolean; checkedAt: number } | null = null;

  private static async isDbAvailable(): Promise<boolean> {
    const now = Date.now();
    if (this.dbAvailableCache && now - this.dbAvailableCache.checkedAt < 10000) {
      return this.dbAvailableCache.available;
    }
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('db check timeout')), 300)),
      ]);
      this.dbAvailableCache = { available: true, checkedAt: now };
      return true;
    } catch {
      this.dbAvailableCache = { available: false, checkedAt: now };
      return false;
    }
  }
}
