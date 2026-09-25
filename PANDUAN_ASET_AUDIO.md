# 🎧 Panduan Aset Audio & Pengoperasian "FOS Best Performer"

Sistem award announcement ini sudah mengadopsi sistem **Hybrid Audio**:
- **Bisa langsung jalan 100% tanpa file MP3!** Engine bawaan menggunakan *Web Audio API Synthesizer* untuk mensimulasikan getaran sub-bass 808, dentuman hit countdown, riser ketegangan, ledakan boom, crowd cheering, dan alunan melodi nada Happy Cat.
- **Jika Anda memasukkan file MP3 asli ke folder `assets/sounds/`**, sistem secara otomatis akan memprioritaskan dan memutar audio MP3 tersebut untuk pengalaman audio panggung yang paling maksimal!

---

## 📁 Checklist File MP3 di Folder `/assets/sounds/`

Silakan unduh atau masukkan file audio dengan format `.mp3` berikut ke dalam direktori `assets/sounds/`:

| Nama File | Waktu Diputar | Karakter Suara yang Disarankan | Rekomendasi Sumber / Keyword |
| :--- | :--- | :--- | :--- |
| **`suspense.mp3`** | `0s` (Opening) | Suasana tegang, dark cinematic ambient drone, atau drumroll pelan menjelang pengumuman penting. | *Cinematic tension drone*, *Suspense riser*, *Award nomination background*. |
| **`countdown-hit.mp3`**| `4s`, `5s`, `6s` (Hit 3, 2, 1) | Suara benturan digital tebal, thud sub-bass, atau kick proyektor bioskop (seperti trailer film Christopher Nolan). | *Sub-bass drop hit*, *Cinematic trailer thud*, *Countdown beep hit*. |
| **`riser.mp3`** | `6s` - `7s` (Hit angka 1) | Suara pitch naik melengking tegang sebelum hening sesaat (*riser whoosh*). | *Tension riser fx*, *Cinematic whoosh build-up*. |
| **`explosion.mp3`** | `10s` (BOOM Reveal) | Ledakan super keras dengan bass menggelegar (*explosion with debris & sub bass*). | *Massive explosion sound effect*, *Bass boosted boom vine meme*. |
| **`cheering.mp3`** | `10s` (BOOM Reveal) | Suara sorak-sorai penonton riuh (*stadium cheering*). **Diputar bersamaan dengan clapping.mp3!** | *Crowd cheering applause*, *Stadium victory cheer*. |
| **`clapping.mp3`** | `10s` (BOOM Reveal) | Suara gemuruh tepuk tangan penonton (*audience applause*). **Diputar bersamaan dengan cheering.mp3!** | *Audience clapping applause*, *Crowd handclap*. |
| **`happy-happy-happy.mp3`** | `12s`+ (Happy Cat) | Potongan audio meme legendaris **"Happy, Happy, Happy!"** (dari lagu *My Happy Song* - Super Simple Songs). | Cari di YouTube / TikTok / MyInstants: *"Happy Happy Happy Cat meme audio mp3"*. |

---

## 🔗 Rekomendasi Tempat Unduh Efek Suara Gratis (Royalty-Free)
1. **MyInstants / 101Soundboards**: Sangat bagus untuk suara meme cepat (Happy Happy Happy Cat, Boom Vine Meme).
2. **Pixabay Audio** (`pixabay.com/sound-effects/`): Koleksi gratis tanpa royalti untuk *cinematic impact, fireworks explosion, crowd cheer*.
3. **Freesound.org**: Pencarian suara atmosfer drumroll, award gong, atau riser.

---

## ⌨️ Kontrol Keyboard Saat Presentasi (Projector Mode)

| Tombol | Fungsi |
| :--- | :--- |
| **`SPACE`** | **Mulai Show / Ulangi** langsung dari awal. |
| **`F`** | **Toggle Layar Penuh (Fullscreen)** agar address bar browser hilang. |
| **`M`** | **Mute / Unmute Suara** (Toggle audio darurat jika mic presenter ingin masuk). |
| **`S`** | **Buka Panel Pengaturan Cepat (Quick Edit)** untuk mengubah nama pemenang secara live tanpa perlu reload file code. |
| **`R`** | **Restart Animasi** seketika dari opening awal. |
| **`ESC`** | Tutup panel pengaturan atau keluar dari mode fullscreen. |

---

## ⚙️ Mengubah Nama Pemenang
Ada dua cara mudah untuk mengganti nama pemenang:

### Cara 1: Langsung di Browser (Paling Praktis saat Gladi Resik)
1. Tekan tombol **`S`** pada keyboard atau klik icon **`⚙️`** di pojok kanan atas.
2. Ketik nama pemenang pada kotak teks (satu baris untuk setiap pemenang).
3. Klik **"Simpan & Mulai Show"**. Data otomatis tersimpan di browser Anda!

### Cara 2: Melalui File `script.js`
Buka file `script.js` dan ubah array `winners` di bagian paling atas:
```javascript
const DEFAULT_CONFIG = {
  winners: [
    "NAMA PEMENANG 1",
    "NAMA PEMENANG 2",
    "NAMA PEMENANG 3"
  ],
  title: "FOS BEST PERFORMER",
  subtitle: "Siapakah yang paling gacor dalam pengisian FOS?",
  awardCategory: "TERBAIK DALAM PENGISIAN SISTEM FOS"
  // ...
};
```
