# Nano-Medika: Ekspedisi Mikro 3D

Game aksi-edukasi biologi 3D berbasis **Three.js (WebGL2 PBR + Ray Tracing)** dan **fisika fluida**, mengisahkan **Profesor Aris** dan robot asistennya **B.I.O.-7** yang masuk ke dalam tubuh cucunya mulai dari rongga mulut hingga aliran darah, sistem saraf pusat, dan jantung untuk membasmi patogen misterius.

## Fitur Utama
- **Grafik 3D PBR & Ray Tracing**: Refleksi lingkungan dinamis `CubeCamera`, *Screen-Space Ray-Marched Reflections*, *Volumetric God-Rays*, `UnrealBloomPass`, serta shader jaringan organik `onBeforeCompile`.
- **Fisika Fluida 3D**: Hambatan viskositas tiap organ, arus aliran darah, detak jantung, tumbukan elastis dinding terowongan, dan 140+ eritrosit fisik.
- **Minimap Melingkar Transparan**: Menampilkan kontur koridor anatomi *real-time*, posisi kapal, B.I.O.-7, patogen, dan arah menuju organ target.
- **Pembelajaran Biologi Interaktif**:
  - **Bio-Ensiklopedia B.I.O.-7** (8 entri anatomi, sel darah, sistem saraf, & patogen yang terbuka otomatis saat eksplorasi).
  - **Kuis Biologi Profesor Aris** saat membuka gerbang antar-zona untuk bonus Integritas Hull & Bio-Energi.
- **Optimal di Desktop & Mobile**:
  - **Desktop**: `WASD` gerak, `Q/E` naik-turun, `Mouse` bidik & tembak, `Spasi` Boost, `F` B.I.O.-7, `1-3` senjata, `R` toggle Ray Tracing.
  - **Mobile / Layar Sentuh**: Dual virtual joystick sentuh (*Gerak* di kiri + tombol Naik/Turun, *Bidik & Tembak* di kanan + tombol Boost & B.I.O.-7).
- **Penyimpanan Progres `localStorage`**: Menyimpan rekor skor, total virus dibasmi, entri ensiklopedia, serta zona tertinggi yang sudah terbuka.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser desktop atau mobile.

## Build 1 File Single HTML

Untuk menghasilkan **1 file HTML mandiri** (semua HTML, CSS Tailwind, React, Three.js, shader, fisika, dan Web Audio tergabung tanpa dependensi eksternal):

```bash
npm run build:single
```

File hasil build tersedia di `dist/nano-medika-single.html` dan dapat langsung dibuka di browser maupun dihosting sebagai satu file statis.

## Deploy ke GitHub & Vercel

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Nano-Medika 3D"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
2. **Hosting di Vercel**:
   - Masuk ke [vercel.com](https://vercel.com), klik **Add New Project**, lalu pilih repositori GitHub Anda.
   - Vercel akan otomatis menggunakan konfigurasi `vercel.json` (`framework: vite`, output `dist/`).
   - Klik **Deploy** — aplikasi siap dimainkan secara publik.
