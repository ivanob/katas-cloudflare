/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		if (request.method === 'GET' && url.pathname === '/api/images') {
			
			return new Response("Received GET request for /images");
		}
		if (request.method === 'POST' && url.pathname === '/api/images') {
			return new Response("Received POST request for /images");
		}
		if (request.method === 'DELETE' && url.pathname === '/api/images/:id') {
		// Delete image
		}
		return new Response("Method not implemented", { status: 501 });
	},
} satisfies ExportedHandler<Env>;
