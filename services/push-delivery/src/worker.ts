// The Stands — push-delivery service (downstream of the notifier)
// Consumes notification.created events and sends each inbox row to the
// fan's registered Web Push devices. With VAPID keys configured it sends
// for real; without them it dry-runs (logs what it would send) so the
// pipeline can be exercised end to end. Dead subscriptions (404/410 from
// the push service) are pruned. Idempotent via notifications.pushed.

import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BusEvent, consumeEvents, getAdminSupabase } from '@thestands/core';

const intervalSeconds = Number(process.env.PUSH_INTERVAL_SECONDS || 20);

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@thestands.fan';
const live = Boolean(vapidPublic && vapidPrivate);
if (live) webpush.setVapidDetails(vapidSubject, vapidPublic!, vapidPrivate!);

async function handle(supabase: SupabaseClient, event: BusEvent) {
  const id: string | undefined = event.payload?.notification_id;
  if (!id) return;

  const { data: note } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, match_id, pushed')
    .eq('id', id)
    .maybeSingle();
  if (!note || note.pushed) return; // replayed event — already delivered

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', note.user_id);
  if (subsError) throw new Error(subsError.message);

  const payload = JSON.stringify({
    title: note.title,
    body: note.body ?? '',
    url: note.match_id ? `/match/${note.match_id}` : '/',
  });

  let sent = 0;
  const dead: string[] = [];
  for (const sub of subs ?? []) {
    if (!live) {
      console.log(`[push-delivery] DRY RUN → ${sub.endpoint.slice(0, 48)}… :: ${note.title}`);
      sent++;
      continue;
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        dead.push(sub.id); // device unsubscribed — prune it
      } else {
        console.error(`[push-delivery] send failed (${status ?? 'network'}): ${note.title}`);
      }
    }
  }
  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', dead);
    console.log(`[push-delivery] pruned ${dead.length} dead subscriptions`);
  }

  await supabase.from('notifications').update({ pushed: true }).eq('id', note.id);
  if ((subs ?? []).length > 0) {
    console.log(`[push-delivery] "${note.title}" → ${sent}/${subs!.length} devices${live ? '' : ' (dry run)'}`);
  }
}

async function tick() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    console.error('[push-delivery] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return false;
  }
  const result = await consumeEvents(supabase, 'push-delivery', (event) => handle(supabase, event), {
    topics: ['notification.created'],
  });
  if (result.error) {
    console.error(`[push-delivery] error at cursor ${result.lastEventId}: ${result.error}`);
    return false;
  }
  if (result.processed > 0) {
    console.log(`[push-delivery] processed ${result.processed} events → cursor ${result.lastEventId}`);
  }
  return true;
}

const once = process.argv.includes('--once');
console.log(
  `[push-delivery] starting${once ? ' (single run)' : ` — every ${intervalSeconds}s`} · transport: ${live ? 'web-push' : 'DRY RUN (set VAPID keys to send)'}`
);
const ok = await tick();
if (!once) {
  setInterval(tick, intervalSeconds * 1000);
} else if (!ok) {
  process.exit(1);
}
