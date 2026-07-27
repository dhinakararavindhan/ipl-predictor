// Event-bus consumer runtime, shared by every downstream service.
// Each consumer owns a named cursor; events are delivered at-least-once in
// order, so handlers must be idempotent (unique keys / recounts, not blind
// increments).

import type { SupabaseClient } from '@supabase/supabase-js';

export interface BusEvent {
  id: number;
  topic: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  created_at: string;
}

export interface ConsumeResult {
  processed: number;
  lastEventId: number;
  error?: string;
}

export async function consumeEvents(
  supabase: SupabaseClient,
  consumer: string,
  handler: (event: BusEvent) => Promise<void>,
  opts: { batch?: number; topics?: string[] } = {}
): Promise<ConsumeResult> {
  const batch = opts.batch ?? 100;

  const { data: cursor, error: cursorError } = await supabase
    .from('service_cursors')
    .select('last_event_id')
    .eq('consumer', consumer)
    .maybeSingle();
  if (cursorError) return { processed: 0, lastEventId: 0, error: cursorError.message };
  let lastId = cursor?.last_event_id ?? 0;

  let query = supabase
    .from('events')
    .select('id, topic, payload, created_at')
    .gt('id', lastId)
    .order('id', { ascending: true })
    .limit(batch);
  if (opts.topics && opts.topics.length > 0) query = query.in('topic', opts.topics);
  const { data: events, error: eventsError } = await query;
  if (eventsError) return { processed: 0, lastEventId: lastId, error: eventsError.message };

  let processed = 0;
  for (const event of events ?? []) {
    try {
      await handler(event as BusEvent);
    } catch (err) {
      // stop at the failing event; the cursor stays behind it for a retry
      await saveCursor(supabase, consumer, lastId);
      return {
        processed,
        lastEventId: lastId,
        error: `event ${event.id} (${event.topic}): ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    lastId = event.id;
    processed++;
  }

  await saveCursor(supabase, consumer, lastId);
  return { processed, lastEventId: lastId };
}

async function saveCursor(supabase: SupabaseClient, consumer: string, lastEventId: number) {
  await supabase
    .from('service_cursors')
    .upsert(
      { consumer, last_event_id: lastEventId, updated_at: new Date().toISOString() },
      { onConflict: 'consumer' }
    );
}
