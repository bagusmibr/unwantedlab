# UNWANTED LAB (TikTok Video Processor)

UNWANTED LAB adalah alat untuk memproses video agar mendapatkan hasil optimal saat di-upload ke TikTok dengan mem-bypass kompresi TikTok 120fps.

## Cara Kerja & Proses Aplikasi

Aplikasi ini menggunakan perpaduan pemadatan kualitas tinggi dan trik rekayasa metadata agar TikTok memberikan *bitrate* (kualitas) tertinggi pada video Anda.

1. **Siapkan Video**: Siapkan video mentahan (sebaiknya sudah 60fps) yang sudah Anda edit.
2. **Pilih Mode**:
   - **HQ_REENCODE**: Melakukan encode ulang (libx264 CRF 18) untuk memadatkan *size* tanpa kehilangan kualitas, sebelum di-upload.
   - **FAST_TRICK**: Menyuntikkan trik metadata khusus ke dalam video secara instan tanpa re-encode. Ini berfungsi mengelabui sistem Ingest TikTok seolah video ber-framerate 120fps.
   - **COMBO_MAX**: Menjalankan HQ_REENCODE terlebih dahulu untuk kompresi maksimal, lalu otomatis menyuntikkan FAST_TRICK pada hasil outputnya. (Sangat Direkomendasikan)
3. **Eksekusi**: Anda cukup melakukan *Drag & Drop* video ke dalam area aplikasi. Aplikasi akan memproses video secara otomatis dan menampilkan log prosesnya di layar.

## Apa yang Terjadi Setelah Selesai?

Setelah proses mencapai 100% dan muncul tulisan **✓ Selesai** (atau **✓ COMBO Selesai!**), Anda akan mendapatkan file video baru.
1. File tersebut akan otomatis tersimpan di folder yang **sama persis** dengan lokasi video asli Anda.
2. File output ini akan ditandai dengan tambahan akhiran `_shifted.mp4` (misalnya: `video_asli.mp4` akan menghasilkan `video_asli_shifted.mp4`).
3. **PENTING**: Jika Anda memutar file `_shifted.mp4` ini di komputer atau HP Anda secara langsung menggunakan *video player* biasa, videonya mungkin akan terlihat patah-patah, *slow-motion*, atau durasinya menjadi bertambah panjang berkali lipat. **Ini adalah hal yang normal dan disengaja** karena trik framerate tinggi sedang aktif. 

## Cara Upload ke TikTok

Untuk mendapatkan hasil yang benar-benar 60fps yang mulus dan jernih di TikTok:
1. **WAJIB** menggunakan **Browser di PC/Laptop** (Google Chrome, Safari, atau Edge). Jangan menggunakan aplikasi TikTok di HP (Android/iPhone) untuk meng-upload file hasil olahan ini.
2. Buka [tiktok.com](https://www.tiktok.com/) di browser PC dan login ke akun Anda.
3. Klik tombol **Upload** di pojok kanan atas.
4. Masukkan file `_shifted.mp4` yang dihasilkan dari aplikasi UNWANTED LAB.
5. Tunggu hingga proses upload selesai dan ter-publish. Setelah dipublikasikan, sistem server TikTok akan memproses ulang video *slow-motion* tersebut sehingga videonya akan **kembali berjalan normal** dengan kualitas 60fps yang super jernih, baik diakses dari HP (iPhone/Android) maupun PC.

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
