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

export interface Env {
  AI: Ai,
  R2: R2Bucket,
  D1: D1Database
}

class ErrorStoringData extends Error {}

const readImageFromR2 = async (imageKey: string, env: Env): Promise<R2ObjectBody | null> => {
	try {
		return env.R2.get(imageKey);
	} catch (error: any) {
		throw new ErrorStoringData(`Error reading image from R2: ${error.message}`);
	}
};

const storeImageMetadataInD1 = async (imageKey: string, description: string, env: Env): Promise<void> => {
	try {
		await env.D1.prepare(`CREATE TABLE IF NOT EXISTS images (
			id TEXT PRIMARY KEY,
			description TEXT
			);`).run();
		await env.D1.prepare(`INSERT INTO images (id, description) VALUES (?, ?)`)
			.bind(imageKey, description)
			.run();
	} catch (error: any) {
		throw new ErrorStoringData(`Error storing image metadata in D1: ${error.message}`);
	}
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
	const body = await request.json();
	const imageKey = body.imageKey;
	console.log(`Received request for image key: ${imageKey}`);
	const image = await readImageFromR2(imageKey, env);
	if(!image){
		return new Response("Image not found", {status: 404});
	}
    const blob = await image.arrayBuffer();
    const input = {
      image: [...new Uint8Array(blob)],
      prompt: "Generate a caption for this image",
      max_tokens: 512,
    };
    const response = await env.AI.run(
      "@cf/llava-hf/llava-1.5-7b-hf",
      input
      );
	console.log(response);
	await storeImageMetadataInD1(imageKey, response.description, env);
    return new Response(JSON.stringify(response));
  },
} satisfies ExportedHandler<Env>;