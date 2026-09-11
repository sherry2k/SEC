import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Atomically assigns the next number for a document prefix/year, e.g.
// nextDocumentNumber("PRJ") -> 7 for the 7th project code issued this year.
// Safe under concurrent requests: the upsert increments in one statement,
// so two people creating documents at the same moment never collide.
export async function nextDocumentNumber(prefix: string, year = new Date().getFullYear()): Promise<number> {
  const result = await db.execute<{ next_number: number }>(sql`
    INSERT INTO document_sequences (prefix, year, next_number)
    VALUES (${prefix}, ${year}, 1)
    ON CONFLICT (prefix, year)
    DO UPDATE SET next_number = document_sequences.next_number + 1
    RETURNING next_number
  `);
  const row = result.rows[0];
  if (!row) throw new Error(`Could not assign a number for ${prefix}/${year}`);
  return row.next_number;
}

export async function nextDocumentCode(prefix: string, year = new Date().getFullYear()): Promise<string> {
  const number = await nextDocumentNumber(prefix, year);
  return `SEC/${prefix}/${year}/${String(number).padStart(4, "0")}`;
}
