29 Sept 2025 - 03 Oct 2025

Website keuangan sudah memiliki halaman utama dengan sidebar navigasi (Dashboard, Transaksi, Laporan) dan tampilan ringkasan keuangan. Script JavaScript berhasil menampilkan data transaksi dummy dalam tabel, serta menghitung total aset, pendapatan, dan beban secara otomatis.

2172025 - Nama: Morel


1. Pekerjaan yang telah dilakukan:
Membuat desain dan struktur halaman utama (index.html) dengan sidebar dan dashboard.
Memisahkan logika ke script.js untuk menampilkan transaksi dan menghitung ringkasan keuangan.
Membuat database MySQL dengan tabel users, kategori, transaksi, dan saldo.
Menyusun contoh backend server.js (Express + MySQL) dengan route GET dan POST /api/transaksi.
2. Kendala yang ditemui:
Data frontend belum terhubung ke database secara penuh.
Terjadi error CORS saat uji coba fetch API.
Password user masih plain text di database.
3. Cara mengatasi kendala:
Menambahkan middleware cors() pada backend.
Merencanakan hashing password menggunakan bcrypt.
Akan menghubungkan script.js ke API menggunakan fetch() agar data real-time.
4. Rencana selanjutnya:
Implementasi login & register user.
Menyambungkan frontend ke backend sepenuhnya.
Menambahkan fitur export ke Excel.
