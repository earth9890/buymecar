import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { SLOTS } from "@/lib/slots-config";

const globalForDb = globalThis as unknown as {
  __buymecar_client?: Client;
  __buymecar_ready?: Promise<void>;
};

function getClient(): Client {
  if (!globalForDb.__buymecar_client) {
    globalForDb.__buymecar_client = createClient({
      url: process.env.DATABASE_URL ?? "file:./data/buymecar.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return globalForDb.__buymecar_client;
}

export const db = drizzle(getClient(), { schema });

/**
 * Creates tables if missing and seeds the slot catalogue from slots-config.
 * Idempotent; safe to call on every request (memoised per process).
 */
export function ensureDb(): Promise<void> {
  if (!globalForDb.__buymecar_ready) {
    globalForDb.__buymecar_ready = (async () => {
      const client = getClient();
      await client.executeMultiple(`
        CREATE TABLE IF NOT EXISTS slots (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          start_cents INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bids (
          id TEXT PRIMARY KEY,
          slot_id TEXT NOT NULL,
          brand_name TEXT NOT NULL,
          url TEXT NOT NULL,
          tagline TEXT,
          logo_url TEXT,
          email TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          provider TEXT NOT NULL DEFAULT 'dodo',
          checkout_session_id TEXT,
          payment_id TEXT,
          created_at INTEGER NOT NULL,
          paid_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS bids_slot_status_idx ON bids (slot_id, status, amount_cents);
        CREATE INDEX IF NOT EXISTS bids_session_idx ON bids (checkout_session_id);
      `);
      // Additive migrations for databases created before a column existed.
      try {
        await client.execute("ALTER TABLE bids ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0");
      } catch {
        /* column already there */
      }
      const now = Date.now();
      for (const s of SLOTS) {
        await db.run(sql`
          INSERT INTO slots (id, label, start_cents, created_at)
          VALUES (${s.id}, ${s.label}, ${s.startCents}, ${now})
          ON CONFLICT(id) DO UPDATE SET label = excluded.label, start_cents = excluded.start_cents
        `);
      }
    })().catch((err) => {
      globalForDb.__buymecar_ready = undefined;
      throw err;
    });
  }
  return globalForDb.__buymecar_ready;
}
