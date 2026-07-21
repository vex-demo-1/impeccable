// GET /api/roll?scope=direction|surface&mode=<persuade|operate|read|experience>&key=<key>&reroll=<n>
//
// Deals a deterministic concept roll: six challengers (two per translation
// tier, rating-weighted) plus one mode-matched staging. Same key + same pool
// revision reproduces the roll. The request itself is the impression record.

import { rollSeed, logEvent, SEED_MODES, CORS_HEADERS } from './_worldroll.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') || 'surface';
  const mode = url.searchParams.get('mode') || null;
  const key = url.searchParams.get('key') || crypto.randomUUID().slice(0, 8);
  const reroll = Number(url.searchParams.get('reroll') || 0);

  if (scope !== 'direction' && scope !== 'surface') {
    return Response.json({ error: 'scope must be direction or surface' }, { status: 400, headers: CORS_HEADERS });
  }
  if (mode !== null && !SEED_MODES.has(mode)) {
    return Response.json({ error: 'mode must be persuade, operate, read, or experience' }, { status: 400, headers: CORS_HEADERS });
  }
  if (!Number.isInteger(reroll) || reroll < 0 || reroll > 8) {
    return Response.json({ error: 'reroll must be an integer between 0 and 8' }, { status: 400, headers: CORS_HEADERS });
  }
  if (!/^[a-z0-9-]{1,64}$/i.test(key)) {
    return Response.json({ error: 'key must be 1-64 alphanumeric characters' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const roll = await rollSeed({ scope, key, mode, reroll });
    logEvent(env, 'roll', {
      scope,
      mode,
      reroll,
      poolRevision: roll.poolRevision,
      dealtIds: [...roll.challengers.map(challenger => challenger.id), roll.staging?.id].filter(Boolean),
    });
    return Response.json(roll, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
