# Sistem Informasi Sekolah (SIS)

Proyek ini dijalankan dengan **bun** — jangan gunakan npm/yarn/pnpm.

## Setup

```sh
bun install
```

## Developing

```sh
bun run dev

# atau jalankan server dan buka aplikasi di tab browser baru
bun run dev -- --open
```

## Build & Preview

```sh
bun run build
bun run preview
```

## Lainnya

- Type check: `bun run check`
- Seed dummy data: `bun run seed:dummy`
- Deploy target: Cloudflare (adapter-cloudflare, `wrangler.toml`)
