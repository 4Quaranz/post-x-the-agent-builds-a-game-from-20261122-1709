// Star Catcher — entri video-on-X untuk bounty make.fun
// "The agent builds a game from one prompt" (Node 22, standard library only).
//
// Entrinya adalah POSTINGAN X-nya sendiri: video pendek tentang AI agent yang
// membangun game browser kecil (game.html di repo ini) dari satu prompt,
// diposting sebagai video native di X dari akun publik, dengan make.fun /
// @makefunai dan play code di teks postingannya. Program ini hanya bertugas
// menyerahkan alamat postingan itu ke grader: menyalin POST.json dari root
// repo ke /output/POST.json, tempat gate membacanya.
//
// Cara jalan lokal (di luar container grader, MAKEFUN_BOT_DIR dan
// MAKEFUN_OUTPUT_DIR menggantikan /bot dan /output):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// Hasilnya: out/POST.json identik byte demi byte dengan POST.json repo ini.
//
// POST.json wajib berisi alamat postingan yang sebenarnya, contoh:
//   {"url": "https://x.com/<handle>/status/<id>"}
// Placeholder tidak lolos gate — itu sengaja, supaya entri tanpa postingan
// tidak bisa lewat.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const POST_FILE = "POST.json";

const source = join(BOT_DIR, POST_FILE);
const target = join(OUTPUT_DIR, POST_FILE);

if (!existsSync(source)) {
  console.error(`POST.json tidak ditemukan di ${BOT_DIR} — isi dulu alamat postingan X.`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

try {
  copyFileSync(source, target);
} catch (err) {
  console.error(`POST.json gagal disalin dari ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

// Sukses: tidak ada output lain. Grader membaca /output/POST.json.
