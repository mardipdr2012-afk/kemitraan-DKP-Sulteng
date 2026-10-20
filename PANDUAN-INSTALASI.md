# Panduan Instalasi SIKAKON (Backend GAS + Frontend GitHub Pages)

## A. Backend — Google Apps Script (berkas: Kode.gs, TIDAK ikut ZIP)
1. Buka https://script.google.com → Proyek Baru → rename `Code.gs` menjadi `Kode`, hapus isinya, tempel seluruh `Kode.gs`.
2. Pilih fungsi `setupAppEnvironment` → ▶ Run → Review permissions → izinkan Sheets & Drive. URL spreadsheet ada di Execution Log. Jalankan HANYA SEKALI.
3. Deploy → New deployment → jenis **Web app** → Execute as: **Me** · Who has access: **Anyone** → Deploy → salin URL berakhiran `/exec`.
4. Uji: buka `URL/exec` di browser → harus tampil JSON `{"success":true,...}`.
5. Setiap mengubah Kode.gs, buat **New deployment** lagi (atau Manage deployments → edit → New version).
Akun demo (sandi `Sikakon@2026`, segera ganti lewat Kelola Akun): admin@sikakon.go.id, budi@sikakon.go.id, uptd@sikakon.go.id, kepala.uptd@sikakon.go.id, ahmad@baharilestari.org (Mitra).

## B. Frontend — GitHub Pages
Folder kerja = hasil ekstraksi `sikakon-frontend.zip`. **Folder inilah yang di-`git init`** (di dalamnya langsung terlihat `index.html`, `css`, `js`). Jangan masuk lebih dalam atau naik satu level.
1. Buka `js/config.js`, ganti `ISI_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A3. Simpan.
2. Install Git (https://git-scm.com), cek `git --version`. Atur identitas sekali saja:
```
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```
3. Di github.com: **+** → New repository → nama mis. `sikakon` → **Public** → JANGAN centang README/.gitignore/license → Create.
4. Buka folder hasil ekstraksi di File Explorer → klik address bar → ketik `powershell` → Enter. Jalankan `dir` dan pastikan `index.html`, `css`, `js` terlihat. Jika tidak, STOP.
5. Satu per satu:
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/sikakon.git
git push -u origin main
```
Saat diminta Password, tempel **Personal Access Token** (github.com/settings/tokens → Generate new token (classic) → centang `repo`). Layar tampak kosong saat paste — itu normal. Jangan upload lewat tombol "Upload files" di web GitHub (struktur folder rusak).
6. Repo → Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save; centang Enforce HTTPS. Tunggu 1–2 menit; situs di `https://USERNAME.github.io/sikakon/`.

## C. Update
Dari folder yang sama: `git add .` → `git commit -m "pesan"` → `git push`. Tekan Ctrl+Shift+R bila tampilan lama.

## D. Masalah umum
- Situs 404 → `index.html` tidak di root repo (git init di folder salah).
- Beranda kosong / "GAS_URL belum diisi" → periksa `js/config.js`, lalu push ulang.
- Gagal login / error jaringan → deployment harus **Anyone** dan URL berakhiran `/exec` (bukan `/dev`).
- Perubahan backend tak berefek → belum membuat deployment baru.
