// Serves world design-system cards from R2 so the 100MB+ of generated WebP
// stays out of git and out of every Pages deploy. Cards are uploaded by
// `bun run world-cards:publish` (scripts/publish-world-cards.mjs); the build
// strips local card files from the static output so this route owns the path.

const FILE_PATTERN = /^[a-z0-9-]+\.webp$|^manifest\.json$/;

export async function onRequestGet(context) {
	const parts = context.params.file;
	const file = Array.isArray(parts) ? parts.join('/') : parts;

	if (!file || !FILE_PATTERN.test(file)) {
		return new Response('Not found', { status: 404 });
	}

	const object = await context.env.WORLD_CARDS.get(file);
	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const headers = new Headers();
	headers.set('Content-Type', file.endsWith('.json') ? 'application/json; charset=utf-8' : 'image/webp');
	headers.set('ETag', object.httpEtag);
	// Card URLs carry a ?v= generation stamp, so long immutable caching is safe:
	// a regenerated card gets a new URL and bypasses every cache.
	headers.set('Cache-Control', file.endsWith('.json')
		? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600'
		: 'public, max-age=31536000, immutable');

	return new Response(object.body, { headers });
}
