# UNWANTED LAB (TikTok Video Processor)

UNWANTED LAB adalah alat untuk memproses video agar mendapatkan hasil optimal saat di-upload ke TikTok (Bypass kompresi TikTok 120fps menggunakan Haze Method).

## Mode yang Tersedia
1. **HQ_REENCODE**: Melakukan encode ulang menggunakan `libx264` (CRF 18) untuk memadatkan *size* tanpa kehilangan kualitas, sebelum di-upload.
2. **FAST_TRICK**: Menyuntikkan trik metadata `itsscale 2` ke dalam video secara instan tanpa re-encode. Ini berfungsi mengelabui sistem Ingest TikTok seolah video ber-framerate 120fps.
3. **COMBO_MAX**: Menjalankan HQ_REENCODE terlebih dahulu, lalu otomatis menyuntikkan FAST_TRICK pada hasil outputnya.

---

## Cara Compile / Build Aplikasi Sendiri

Jika Anda ingin meng-compile (build) aplikasi ini sendiri dari *source code*, silakan ikuti langkah-langkah di bawah ini.

### Persyaratan
- Anda harus menginstal **Node.js** di komputer Anda. [Download Node.js di sini](https://nodejs.org/).

### Langkah-langkah
1. **Clone Repositori ini:**
   ```bash
   git clone https://github.com/bagusmibr/unwantedlab.git
   cd unwantedlab
   ```

2. **Install Dependencies:**
   Jalankan perintah ini untuk mengunduh semua modul yang dibutuhkan (seperti Electron dan FFmpeg):
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi (Mode Development):**
   Untuk sekadar mengetes aplikasi tanpa mem-build-nya:
   ```bash
   npm start
   ```

4. **Compile menjadi Aplikasi (Release Build):**
   Jalankan salah satu perintah berikut sesuai dengan sistem operasi target Anda:

   - Untuk membuat **Aplikasi Windows (`.exe`)**:
     ```bash
     npm run build:win
     ```
     *(Hasilnya akan ada di folder `dist/` dalam bentuk portable exe atau folder win-unpacked)*

   - Untuk membuat **Aplikasi macOS (`.app`)**:
     ```bash
     npm run build:mac
     ```
     *(Hasilnya akan ada di folder `dist/`)*

---
*Created by Bagus (Shifted) · MIBR*
