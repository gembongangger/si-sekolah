/// <reference types="@cloudflare/workers-types/experimental" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: import('./lib/server/db').Database;
			user: import('./lib/server/auth/session').SessionUser | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				EVIDENCE_BUCKET: unknown;
				ENVIRONMENT: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
