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
	AI_API: Fetcher;
	R2: R2Bucket;
	W3_ADMIN: Fetcher;
}

type ImageDesc = {
	key: string;
	name: string;
	size: number;
	ImageType: string;
	content: ArrayBuffer;
};

class ErrorStoringData extends Error {}
class ErrorInParameters extends Error {}
class InternalError extends Error {}

const cache = caches.default;

async function sha256Hex(data: ArrayBuffer): Promise<string> {
	const hash = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const extractImageDataFromRequest = async (request: Request): Promise<ImageDesc> => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		if (!file) {
			throw new ErrorInParameters('No file uploaded');
		}
		// Get file information
		const fileName = file.name;
		const fileSize = file.size;
		const fileType = file.type;
		const fileBuffer = await file.arrayBuffer();
		const fileHash = await sha256Hex(fileBuffer);
		return {
			key: fileHash,
			name: fileName,
			size: fileSize,
			ImageType: fileType,
			content: fileBuffer,
		};
	} catch (error: any) {
		throw new ErrorInParameters(`Error extracting image: ${error.message}`);
	}
};

const readImageFromR2 = async (imageKey: string, env: Env): Promise<R2ObjectBody | null> => {
	try {
		return env.R2.get(imageKey);
	} catch (error: any) {
		throw new ErrorStoringData(`Error reading image from R2: ${error.message}`);
	}
};

const saveImageToR2 = async (image: ImageDesc, env: Env): Promise<void> => {
	try {
		await env.R2.put(image.key, image.content, {
			httpMetadata: {
				contentType: image.ImageType,
			},
			customMetadata: {
				name: image.name,
			},
		});
	} catch (error: any) {
		throw new ErrorStoringData(`Error saving image to R2: ${error.message}`);
	}
};

const callAIService = async (env: Env, imageKey: string): Promise<Response> => {
	try {
		const payload = { imageKey };
		const response = await env.AI_API.fetch('https://internal/process', {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: { 'content-type': 'application/json' },
		});
		return response;
	} catch (error) {
		throw new InternalError('Error processing AI model: ' + (error as Error).message);
	}
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			if (url.pathname !== '/api/images') {
				return new Response('Not found', { status: 404 });
			}
			switch (request.method) {
				case 'GET':
					const imageKey = url.searchParams.get('imageKey') || ' ';
					console.log(`Received request for image key: ${imageKey}`);
					const key = new Request(new URL(request.url).toString(), request);
					const cachedResponse = await cache.match(key);
					if (cachedResponse) {
						console.log(`Cache hit for image key: ${imageKey}`);
						return cachedResponse;
					}else{
						console.log(`Cache miss for image key: ${imageKey}`);
					}
					const image: R2ObjectBody | null = await readImageFromR2(imageKey, env);
					if (!image) {
						return new Response('Image not found', { status: 404 });
					}
					const res = new Response(await image.arrayBuffer());
					await cache.put(key, res.clone());
					return res;
				case 'POST':
					try {
						const image = await extractImageDataFromRequest(request);
						const saveImagePromise = saveImageToR2(image, env).then(() => {
							return callAIService(env, image.key);
						});
						console.log(`Received file: ${image.name}, size: ${image.size}, type: ${image.ImageType}`);
						const notifyCachePurgePromise = env.W3_ADMIN.fetch(new Request('https://internal/api/audit', { 
							method: 'PURGE' // or whatever method you want
						}));
						await Promise.all([saveImagePromise, notifyCachePurgePromise]);
						return new Response(
							JSON.stringify({
								message: 'File uploaded successfully',
							}),
							{
								headers: { 'Content-Type': 'application/json' },
								status: 200,
							},
						);
					} catch (error: any) {
						return new Response(
							JSON.stringify({
								error: error.message,
							}),
							{
								headers: { 'Content-Type': 'application/json' },
								status: 400,
							},
						);
					}
				default:
					return new Response('Method not allowed', { status: 405 });
			}
		} catch (error: any) {
			let codeError = 400;
			if (error instanceof ErrorStoringData) {
				codeError = 500;
			} else if (error instanceof ErrorInParameters) {
				codeError = 400;
			} else if (error instanceof InternalError) {
				codeError = 500;
			}
			return new Response(
				JSON.stringify({
					error: error.message,
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: codeError,
				},
			);
		}
	},
} satisfies ExportedHandler<Env>;
