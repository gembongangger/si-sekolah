import type { Reroute } from '@sveltejs/kit';

// URL pendaftaran publik per sekolah: /ppdb/<slug>
// Diarahkan ke halaman form /ppdb/daftar, tetapi URL di browser tetap <slug>.
// Slug dibaca di load() dari url.pathname.
const RESERVED = new Set(['daftar', 'status', 'api']);

export const reroute: Reroute = ({ url }) => {
	const m = url.pathname.match(/^\/ppdb\/([^/]+)\/?$/);
	if (m && !RESERVED.has(m[1])) {
		return '/ppdb/daftar';
	}
};
