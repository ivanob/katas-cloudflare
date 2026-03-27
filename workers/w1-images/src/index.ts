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

type ImageDesc = {
	key: string;
	name: string;
	size: number;
	ImageType: string;
	content: ArrayBuffer;
};

class ErrorStoringData extends Error {}
class ErrorInParameters extends Error {}

const extractImage = async (request: Request): Promise<ImageDesc> => {
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
		return {
			key: crypto.randomUUID(),
			name: fileName,
			size: fileSize,
			ImageType: fileType,
			content: fileBuffer,
		};
	} catch (error: any) {
		throw new ErrorInParameters(`Error extracting image: ${error.message}`);
	}
};

const saveImageToR2 = async (image: ImageDesc, env: Env): Promise<void> => {
	try {
		await env.R2.put(image.key, image.content, {
			httpMetadata: {
				contentType: image.ImageType,
				contentLength: image.size,
			},
			customMetadata: {
				name: image.name,
			},
		});
	} catch (error: any) {
		throw new ErrorStoringData(`Error saving image to R2: ${error.message}`);
	}
};

const storeImageMetadataInD1 = async (image: ImageDesc, env: Env): Promise<void> => {
	try {
		await env.D1.prepare(`INSERT INTO images (id, name, size, type) VALUES (?, ?, ?, ?)`)
			.bind(image.key, image.name, image.size, image.ImageType)
			.run();
	} catch (error: any) {
		throw new ErrorStoringData(`Error storing image metadata in D1: ${error.message}`);
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
					return new Response('Received GET request for /images');
				case 'POST':
					try {
						const image = await extractImage(request);
						const saveImagePromise = saveImageToR2(image, env);
						const storeImageMetadataPromise = storeImageMetadataInD1(image, env);
						await Promise.all([saveImagePromise, storeImageMetadataPromise]); // Concurrently save image and store metadata
						console.log(`Received file: ${image.name}, size: ${image.size}, type: ${image.ImageType}`);

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
				case 'DELETE':
					return new Response('Method not allowed', { status: 405 });
					break;
				default:
					return new Response('Method not allowed', { status: 405 });
			}
		} catch (error: any) {
			let codeError = 400;
			if (error instanceof ErrorStoringData) {
				codeError = 500;
			}else if (error instanceof ErrorInParameters) {
				codeError = 400;
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
