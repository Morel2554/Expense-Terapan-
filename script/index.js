// Test Transakssi
let transactions = [
  { tanggal: '2025-10-01', akun: 'Kas', deskripsi: 'Penjualan Produk', debit: 5000000, kredit: 0 },
  { tanggal: '2025-10-02', akun: 'Beban Listrik', deskripsi: 'Bayar Tagihan Listrik', debit: 0, kredit: 750000 },
  { tanggal: '2025-10-03', akun: 'Kas', deskripsi: 'Modal Awal', debit: 3000000, kredit: 0 }
];

// Fungsi render tabel transaksi
function renderTransactions() {
  const tableBody = document.getElementById('transactionTable');
  tableBody.innerHTML = '';

  transactions.forEach(trx => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="px-4 py-2 text-sm">${trx.tanggal}</td>
      <td class="px-4 py-2 text-sm">${trx.akun}</td>
      <td class="px-4 py-2 text-sm">${trx.deskripsi}</td>
      <td class="px-4 py-2 text-sm text-right">${trx.debit.toLocaleString('id-ID')}</td>
      <td class="px-4 py-2 text-sm text-right">${trx.kredit.toLocaleString('id-ID')}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Fungsi ringkasan
function updateSummary() {
  let totalPendapatan = 0;
  let totalBeban = 0;

  transactions.forEach(trx => {
    if (trx.debit > 0 && trx.akun === 'Kas') {
      totalPendapatan += trx.debit;
    }
    if (trx.kredit > 0) {
      totalBeban += trx.kredit;
    }
  });

  document.getElementById('totalAset').innerText = `Rp ${(totalPendapatan - totalBeban).toLocaleString('id-ID')}`;
  document.getElementById('totalKewajiban').innerText = 'Rp 0'; // contoh sederhana
  document.getElementById('totalPendapatan').innerText = `Rp ${totalPendapatan.toLocaleString('id-ID')}`;
  document.getElementById('totalBeban').innerText = `Rp ${totalBeban.toLocaleString('id-ID')}`;
}

// Fungsi tambah transaksi baru
function tambahTransaksi(tanggal, akun, deskripsi, debit, kredit) {
  transactions.push({ tanggal, akun, deskripsi, debit, kredit });
  renderTransactions();
  updateSummary();
}

// Render awal
document.addEventListener('DOMContentLoaded', () => {
  renderTransactions();
  updateSummary();
});
