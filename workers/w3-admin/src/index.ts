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
  R2: R2Bucket,
  D1: D1Database
}

type ImageDesc = {
	key: string;
	name: string;
	size: number;
	imageType: string;
	dateUpload: Date;
	description?: string;
};

class ErrorStoringData extends Error {}

const readAllR2Images = async (env: Env): Promise<ImageDesc[]> => {
	try {
		const listed = await env.R2.list();
		const images = listed.objects.map((obj: R2Object) => ({
			key: obj.key,
			name: '',
			size: obj.size,
			imageType: '',
			dateUpload: obj.uploaded
		}));
		return Promise.all(images.map(async (obj: ImageDesc) => {
			const extendedParams = await env.R2.head(obj.key);
			return {
				...obj,
				name: extendedParams?.customMetadata?.name || '',
				imageType: extendedParams?.httpMetadata?.contentType || '',
			}
			
		}));
	} catch (error: any) {
		throw new ErrorStoringData(`Error reading all images from R2: ${error.message}`);
	}
};

const readAIDescriptionOfImage = async (env: Env, imageKey: string): Promise<string> => {
	try{
		return await env.D1
		.prepare("SELECT description FROM images WHERE id = ? LIMIT 1")
		.bind(imageKey)
		.first() || "No description available";
	}catch(error: any){
		throw new ErrorStoringData(`Error reading description of image ${imageKey} from D1: ${error.message}`);
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			if (url.pathname !== '/api/audit') {
				return new Response('Not found', { status: 404 });
			}
			switch (request.method) {
				case 'GET':
					const imagesUploaded = await readAllR2Images(env);
					const imagesWithDesc = await Promise.all(imagesUploaded.map(async (image: ImageDesc) => ({
						...image,
						description: (await readAIDescriptionOfImage(env, image.key))
					})));
					return new Response(JSON.stringify({images: imagesWithDesc}), { status: 200 });
			}
		} catch (error: any) {
			return new Response(`Error: ${error.message}`, { status: 500 });
		}
		return new Response('Method not allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
