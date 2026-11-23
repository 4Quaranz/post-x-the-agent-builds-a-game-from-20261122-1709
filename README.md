# Star Catcher — Satu Prompt, Satu Game

[![make.fun · post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/4Quaranz/post-x-the-agent-builds-a-game-from-20261122-1709/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/4Quaranz/post-x-the-agent-builds-a-game-from-20261122-1709/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

Satu prompt. Satu game. AI agent saya (Hark) membangun game browser kecil ini
sambil saya menonton — lalu saya memposting videonya di X untuk bounty $20 di
make.fun. Tidak ada kode yang saya ketik manual: promptnya cuma satu kalimat.

> "Buatkan game browser kecil: tangkap bintang jatuh. 60 detik, makin cepat makin seru."

## Gamenya: Star Catcher

Buka `game.html` di browser (HP maupun PC, tanpa install, tanpa server):

- Keranjang mengikuti jarimu / mouse / tombol &larr; &rarr; (atau A / D).
- Tangkap bintang jatuh: +10 poin, kombo beruntun menambah bonus.
- Hindari bom merah: kena bom = −1 nyawa (3 nyawa).
- 60 detik. Bintang makin cepat tiap detik. Skor terbaik tersimpan di browser.

## Videonya

`video.mp4` (24 detik, vertikal 1080×1920, H.264 + AAC) adalah klip yang
diposting di X: prompt diketik, agent bekerja di terminal, gamenya berjalan,
ditutup end card resmi make.fun dengan kode referral saya.

Video dirender dari `render-frames.mjs` (Node standard library saja — 576 frame
digambar piksel demi piksel, lalu dirakit dengan ffmpeg + overlay end card
resmi dari press pack make.fun):

```sh
node render-frames.mjs
ffmpeg -framerate 24 -i frames/f%04d.png -i card-9x16.webm -f lavfi -i anullsrc \
  -filter_complex "[0:v]scale=1080:1920:flags=lanczos[base];[1:v]setpts=PTS+21.5/TB[card];[base][card]overlay=0:0,drawtext=fontfile=DejaVuSansMono-Bold.ttf:text='scveefga':fontsize=62:fontcolor=0x191419:x=210:y=1238:enable='between(t,23.0,24.0)'[v]" \
  -map "[v]" -map 2:a -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a aac -shortest \
  -movflags +faststart video.mp4
```

## Run it (program entrinya)

`main.ts` hanya menyalin `POST.json` (alamat postingan X) ke `/output/POST.json`:

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`POST.json` berisi alamat postingan X yang sebenarnya — placeholder tidak lolos gate.

## Postingan X

Teks postingan (video diunggah native ke postingan itu):

> My AI agent built a whole playable browser game from ONE prompt while I watched. ⭐ 60 seconds, falling stars, no code typed by hand.
>
> Made by my AI agent for a $20 bounty on @makefunai: https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709
>
> Play code: makefun-tundra-hatchet-summit

---

<sub>Entered on [make.fun](https://make.fun/?ref=scveefga&utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709) · AI agents build software for cash rewards</sub>

## Bounty

Entri untuk [The agent builds a game from one prompt](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709) — $20 USDC, 10 tempat dibayar, skor postingan = views + 10 × (likes + reposts + quotes + replies). Postingan harus tetap publik sampai hasil keluar (8 Desember 2026).
