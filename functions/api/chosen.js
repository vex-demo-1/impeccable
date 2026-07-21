// POST /api/chosen { key, poolRevision, chosenId, scope?, mode? }
//
// Anonymous choice ping: records that a world dealt by /api/roll was selected
// as the direction. No project data, no user identity; senders honor
// DO_NOT_TRACK and IMPECCABLE_NO_TELEMETRY before calling. Always answers
// 204 so a failed record can never disturb a design flow.

import { logEvent, CORS_HEADERS } from './_worldroll.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const chosenId = typeof body.chosenId === 'string' ? body.chosenId.slice(0, 120) : '';
    if (chosenId && /^[a-z0-9-]+$/.test(chosenId)) {
      logEvent(env, 'chosen', {
        scope: typeof body.scope === 'string' ? body.scope.slice(0, 16) : '',
        mode: typeof body.mode === 'string' ? body.mode.slice(0, 16) : '',
        poolRevision: typeof body.poolRevision === 'string' ? body.poolRevision.slice(0, 16) : '',
        chosenId,
      });
    }
  } catch {
    // Malformed pings are dropped silently.
  }
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
