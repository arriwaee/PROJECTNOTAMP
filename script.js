// Tunggu DOM dimuat
document.addEventListener("DOMContentLoaded", function() {
    
    // --- NAMA DATABASE & STORE ---
    const DB_NAME = 'NotaScaffoldingDB';
    const STORE_NAME = 'notas';
    let db; // Variabel untuk menampung koneksi DB

    // --- AMBIL ELEMEN INPUT ---
    const namaPelangganInput = document.getElementById("nama-pelanggan");
    const alamatPelangganInput = document.getElementById("alamat-pelanggan");
    const uangTransportInput = document.getElementById("uang-transport");
    const namaBarangInput = document.getElementById("nama-barang"); 
    const qtyInput = document.getElementById("qty");
    const hargaInput = document.getElementById("harga");
    
    // --- AMBIL ELEMEN TOMBOL ---
    const tombolTambah = document.getElementById("tombol-tambah");
    const tombolCetak = document.getElementById("tombol-cetak");
    const tombolSimpan = document.getElementById("tombol-simpan");
    const tombolBaru = document.getElementById("tombol-baru");
    
    // --- AMBIL ELEMEN NOTA (PREVIEW) ---
    const notaItemList = document.getElementById("nota-items");
    const notaNamaPelanggan = document.getElementById("nota-nama-pelanggan");
    const notaAlamatPelanggan = document.getElementById("nota-alamat-pelanggan");
    const notaTanggal = document.getElementById("nota-tanggal");
    const notaTotalBarang = document.getElementById("nota-total-barang");
    const notaTransport = document.getElementById("nota-transport");
    const notaGrandTotal = document.getElementById("nota-grand-total");
    
    // --- AMBIL ELEMEN AREA TERSIMPAN ---
    const inputCari = document.getElementById("input-cari");
    const daftarNotaTersimpan = document.getElementById("daftar-nota-tersimpan");
    
    let totalSewaBarang = 0;
    let idNotaSaatIni = null; // Untuk melacak nota yang sedang diedit

    // --- FUNGSI UTAMA ---

    /**
     * Inisialisasi IndexedDB
     */
    async function initDB() {
        db = await idb.openDB(DB_NAME, 1, {
            upgrade(db) {
                // Buat object store (seperti tabel)
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: false // Kita akan buat ID unik sendiri
                });
                // Buat index untuk pencarian
                store.createIndex('namaPelanggan', 'namaPelanggan', { unique: false });
                store.createIndex('tanggal', 'tanggal', { unique: false });
            },
        });
        console.log("Database berhasil terhubung.");
        // Setelah DB siap, tampilkan semua nota
        tampilkanSemuaNota();
    }

    /**
     * Memformat Angka menjadi Rupiah (Rp)
     */
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }
    
    /**
     * Memformat Tanggal
     */
    function formatTanggal(dateObj) {
        return new Date(dateObj).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    /**
     * Menambah barang ke tabel (UI)
     */
    function tambahBarang() {
        const namaBarang = namaBarangInput.value; 
        const qty = parseInt(qtyInput.value);
        const harga = parseInt(hargaInput.value);
        
        if (!namaBarang || isNaN(qty) || isNaN(harga) || qty <= 0 || harga <= 0) {
            alert("Harap isi semua data barang dengan benar!");
            return;
        }
        
        const subtotal = qty * harga;
        
        const barisBaru = document.createElement("tr");
        barisBaru.className = "border-b item-row"; // Tambah class 'item-row'
        barisBaru.innerHTML = `
            <td class="p-2" data-field="namaBarang">${namaBarang}</td>
            <td class="p-2 text-right" data-field="qty">${qty}</td>
            <td class="p-2 text-right" data-field="harga">${formatRupiah(harga)}</td>
            <td class="p-2 text-right font-medium" data-field="subtotal">${formatRupiah(subtotal)}</td>
        `;
        barisBaru.dataset.subtotal = subtotal; 
        barisBaru.dataset.harga = harga; // Simpan data mentah
        
        notaItemList.appendChild(barisBaru);
        
        updateTotalBarang();
        perbaruiPreviewNota(); // Update preview saat barang ditambah
        
        // Kosongkan form input barang
        namaBarangInput.value = ""; 
        qtyInput.value = "1";
        hargaInput.value = "";
        namaBarangInput.focus();
    }

    /**
     * Hitung ulang total sewa barang
     */
    function updateTotalBarang() {
        totalSewaBarang = 0;
        const semuaBaris = notaItemList.querySelectorAll("tr.item-row");
        
        semuaBaris.forEach(function(baris) {
            totalSewaBarang += parseFloat(baris.dataset.subtotal);
        });
        
        notaTotalBarang.textContent = formatRupiah(totalSewaBarang);
        updateGrandTotal();
    }
    
    /**
     * Hitung ulang grand total (Barang + Transport)
     */
    function updateGrandTotal() {
        const transport = parseFloat(uangTransportInput.value) || 0;
        const grandTotal = totalSewaBarang + transport;
        
        notaTotalBarang.textContent = formatRupiah(totalSewaBarang);
        notaTransport.textContent = formatRupiah(transport);
        notaGrandTotal.innerHTML = `<strong>${formatRupiah(grandTotal)}</strong>`;
    }

    /**
     * Memperbarui data di preview nota (pelanggan, alamat, tanggal)
     */
    function perbaruiPreviewNota() {
        notaNamaPelanggan.textContent = namaPelangganInput.value || "-";
        notaAlamatPelanggan.textContent = alamatPelangganInput.value || "-";
        
        const hariIni = new Date();
        notaTanggal.textContent = formatTanggal(hariIni).split(',')[0]; // Hanya tanggal
        
        updateGrandTotal();
    }
    
    /**
     * Mengosongkan semua form input dan preview
     */
    function bersihkanForm() {
        namaPelangganInput.value = "";
        alamatPelangganInput.value = "";
        uangTransportInput.value = "0";
        namaBarangInput.value = "";
        qtyInput.value = "1";
        hargaInput.value = "";
        
        notaItemList.innerHTML = ""; // Kosongkan tabel
        idNotaSaatIni = null; // Reset ID
        
        perbaruiPreviewNota(); // Update preview jadi kosong
        updateTotalBarang();
        
        console.log("Form dibersihkan.");
    }
    
    /**
     * Mengumpulkan semua data dari form menjadi 1 objek
     */
    function kumpulkanDataNota() {
        const transport = parseFloat(uangTransportInput.value) || 0;
        const grandTotal = totalSewaBarang + transport;

        // Kumpulkan semua item dari tabel
        const items = [];
        notaItemList.querySelectorAll("tr.item-row").forEach(baris => {
            items.push({
                namaBarang: baris.querySelector('[data-field="namaBarang"]').textContent,
                qty: parseInt(baris.querySelector('[data-field="qty"]').textContent),
                harga: parseFloat(baris.dataset.harga), // Ambil data mentah
                subtotal: parseFloat(baris.dataset.subtotal) // Ambil data mentah
            });
        });

        // Buat objek nota
        const notaData = {
            id: idNotaSaatIni || 'NOTA-' + Date.now(), // Gunakan ID lama jika ada, atau buat baru
            namaPelanggan: namaPelangganInput.value,
            alamatPelanggan: alamatPelangganInput.value,
            uangTransport: transport,
            totalSewaBarang: totalSewaBarang,
            grandTotal: grandTotal,
            items: items,
            tanggal: new Date()
        };
        return notaData;
    }

    /**
     * Menyimpan nota ke IndexedDB
     */
    async function simpanNota() {
        const notaData = kumpulkanDataNota();
        
        if (!notaData.namaPelanggan) {
            alert("Nama pelanggan tidak boleh kosong!");
            namaPelangganInput.focus();
            return;
        }
        if (notaData.items.length === 0) {
            alert("Tidak ada barang yang ditambahkan!");
            return;
        }

        try {
            // Gunakan 'put' untuk 'insert' atau 'update' jika ID sudah ada
            await db.put(STORE_NAME, notaData); 
            
            alert(`Nota untuk ${notaData.namaPelanggan} berhasil disimpan!`);
            bersihkanForm(); // Kosongkan form setelah simpan
            tampilkanSemuaNota(); // Segarkan daftar nota
            
        } catch (err) {
            console.error("Gagal menyimpan nota:", err);
            alert("Gagal menyimpan nota. Cek console untuk error.");
        }
    }

    /**
     * Menampilkan semua nota dari DB ke daftar
     */
    async function tampilkanSemuaNota(filter = "") {
        let tx = db.transaction(STORE_NAME, 'readonly');
        let store = tx.objectStore(STORE_NAME);
        let allNotas = [];

        // Lakukan pencarian
        if (filter) {
            // Gunakan index 'namaPelanggan'
            const index = store.index('namaPelanggan');
            // IDBKeyRange.bound(filter.toLowerCase(), filter.toLowerCase() + '\uffff')
            // adalah cara 'startsWith' yang rumit.
            // Cara lebih mudah: ambil semua, filter di JS
            let allData = await store.getAll();
            allNotas = allData.filter(nota => 
                nota.namaPelanggan.toLowerCase().includes(filter.toLowerCase())
            ).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Urutkan terbaru dulu
            
        } else {
            // Jika tidak ada filter, ambil semua
            allNotas = await store.getAll();
            allNotas.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Urutkan terbaru dulu
        }

        // Kosongkan daftar sebelum diisi
        daftarNotaTersimpan.innerHTML = "";
        
        if (allNotas.length === 0) {
            daftarNotaTersimpan.innerHTML = `<p class="text-gray-500 text-center p-4">Tidak ada nota tersimpan.</p>`;
            return;
        }

        // Tampilkan setiap nota
        allNotas.forEach(nota => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center p-4 hover:bg-gray-50";
            div.innerHTML = `
                <div>
                    <p class="font-bold text-blue-700">${nota.namaPelanggan}</p>
                    <p class="text-sm text-gray-600">${formatTanggal(nota.tanggal)}</p>
                    <p class="text-sm font-semibold">${formatRupiah(nota.grandTotal)}</p>
                </div>
                <div class="flex space-x-2">
                    <button data-id="${nota.id}" class="tombol-muat bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600">Muat</button>
                    <button data-id="${nota.id}" class="tombol-hapus bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600">Hapus</button>
                </div>
            `;
            daftarNotaTersimpan.appendChild(div);
        });
    }
    
    /**
     * Memuat data nota dari DB ke form
     */
    async function muatNota(id) {
        try {
            const nota = await db.get(STORE_NAME, id);
            if (!nota) {
                alert("Nota tidak ditemukan!");
                return;
            }
            
            // 1. Bersihkan form dulu
            bersihkanForm();
            
            // 2. Isi data pelanggan & transport
            idNotaSaatIni = nota.id; // SET ID SAAT INI
            namaPelangganInput.value = nota.namaPelanggan;
            alamatPelangganInput.value = nota.alamatPelanggan;
            uangTransportInput.value = nota.uangTransport;
            
            // 3. Isi kembali tabel barang
            nota.items.forEach(item => {
                const barisBaru = document.createElement("tr");
                barisBaru.className = "border-b item-row";
                barisBaru.innerHTML = `
                    <td class="p-2" data-field="namaBarang">${item.namaBarang}</td>
                    <td class="p-2 text-right" data-field="qty">${item.qty}</td>
                    <td class="p-2 text-right" data-field="harga">${formatRupiah(item.harga)}</td>
                    <td class="p-2 text-right font-medium" data-field="subtotal">${formatRupiah(item.subtotal)}</td>
                `;
                barisBaru.dataset.subtotal = item.subtotal; 
                barisBaru.dataset.harga = item.harga;
                notaItemList.appendChild(barisBaru);
            });
            
            // 4. Update preview dan total
            perbaruiPreviewNota();
            updateTotalBarang();
            
            // Gulir ke atas
            window.scrollTo(0, 0);
            
        } catch (err) {
            console.error("Gagal memuat nota:", err);
        }
    }
    
    /**
     * Menghapus nota dari DB
     */
    async function hapusNota(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus nota ini secara permanen?")) {
            return;
        }
        
        try {
            await db.delete(STORE_NAME, id);
            alert("Nota berhasil dihapus.");
            tampilkanSemuaNota(inputCari.value); // Segarkan daftar (sesuai filter)
        } catch (err) {
            console.error("Gagal menghapus nota:", err);
        }
    }
    
    /**
     * Memicu fungsi cetak browser
     */
    function cetakNota() {
        // Pastikan preview ter-update sebelum cetak
        perbaruiPreviewNota();
        
        if (notaItemList.querySelectorAll("tr").length === 0) {
            alert("Tidak ada barang untuk dicetak!");
            return;
        }
        
        window.print();
    }


    // --- PASANG EVENT LISTENERS ---

    // Tombol di form input
    tombolTambah.addEventListener("click", tambahBarang);
    tombolSimpan.addEventListener("click", simpanNota);
    tombolCetak.addEventListener("click", cetakNota);
    tombolBaru.addEventListener("click", bersihkanForm);
    
    // Update otomatis saat input diubah
    namaPelangganInput.addEventListener("input", perbaruiPreviewNota);
    alamatPelangganInput.addEventListener("input", perbaruiPreviewNota);
    uangTransportInput.addEventListener("input", perbaruiPreviewNota);
    
    // Fitur Pencarian (live search)
    inputCari.addEventListener("input", (e) => {
        tampilkanSemuaNota(e.target.value);
    });
    
    // Event delegation untuk tombol "Muat" dan "Hapus"
    daftarNotaTersimpan.addEventListener("click", (e) => {
        if (e.target.classList.contains("tombol-muat")) {
            muatNota(e.target.dataset.id);
        }
        if (e.target.classList.contains("tombol-hapus")) {
            hapusNota(e.target.dataset.id);
        }
    });

    // Mulai koneksi DB saat halaman dimuat
    initDB();

});