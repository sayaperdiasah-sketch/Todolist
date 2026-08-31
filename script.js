// =============================================
// script.js — Jejak Menuju Target
// =============================================

// ==================== KONSTANTA ====================
const STORAGE_KEY_PROFIL = 'profilUser';
const STORAGE_KEY_RIWAYAT = 'riwayatCheckIn';
const PENALTI_SKIPPED = 2; // hari
const PENALTI_PARTIAL = 1; // hari

// ==================== UTILITAS ====================
function getProfil() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PROFIL)) || null;
}

function getRiwayat() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RIWAYAT)) || [];
}

function saveRiwayat(riwayat) {
    localStorage.setItem(STORAGE_KEY_RIWAYAT, JSON.stringify(riwayat));
}

function formatTanggal(date = new Date()) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function hitungHariKe(tanggalMulai, tanggalSekarang = new Date()) {
    const mulai = new Date(tanggalMulai);
    const sekarang = new Date(tanggalSekarang);
    const diff = Math.floor((sekarang - mulai) / (1000 * 60 * 60 * 24));
    return diff + 1; // hari ke-1 mulai dari 1
}

function hitungHariDalamMinggu(tanggal = new Date()) {
    return tanggal.getDay(); // 0=Sunday, 6=Saturday; kita bisa konversi 0=Senin? Biarkan saja.
    // Untuk konsistensi: 0=Senin, 6=Minggu? Saya pakai getDay() standar: 0=Minggu.
    // Di dokumentasi ML kita tulis 0=Senin? Sebaiknya ikuti standar JS: 0=Minggu.
    // Nanti di preprocessing bisa disesuaikan.
    // Saya akan pakai getDay() biasa.
}

// ==================== INISIALISASI DASHBOARD ====================
document.addEventListener('DOMContentLoaded', function() {
    const profil = getProfil();
    if (!profil) {
        // Jika belum onboarding, arahkan ke onboarding
        window.location.href = 'onboarding.html';
        return;
    }

    // Tampilkan nama dan target
    document.getElementById('namaUser').textContent = profil.nama || 'User';
    document.getElementById('targetUtama').textContent = profil.target || '-';
    document.getElementById('targetDateDisplay').textContent = profil.targetDate || '-';

    // Tampilkan estimasi (dari riwayat terakhir atau target awal)
    const riwayat = getRiwayat();
    const estimasi = riwayat.length > 0 
        ? riwayat[riwayat.length - 1].estimasi_tanggal 
        : profil.targetDate;
    document.getElementById('estimasiDisplay').textContent = estimasi;

    // Tampilkan poin total
    const poinTotal = riwayat.reduce((sum, r) => sum + r.poin_harian, 0);
    document.getElementById('poinTotal').textContent = poinTotal;

    // Tampilkan tanggal hari ini
    document.getElementById('tanggalHariIni').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Set nilai default slider psikis dari baseline profil
    if (profil.baseline) {
        document.getElementById('inputStres').value = profil.baseline.stres;
        document.getElementById('inputMood').value = profil.baseline.mood;
        document.getElementById('inputEnergi').value = profil.baseline.energi;
        document.getElementById('inputFokus').value = profil.baseline.fokus;
        updatePsikis();
    }

    // Render daftar kebiasaan dari profil
    renderDaftarKebiasaan(profil);
});

// ==================== UPDATE PSIKIS ====================
function updatePsikis() {
    const stres = document.getElementById('inputStres').value;
    const mood = document.getElementById('inputMood').value;
    const energi = document.getElementById('inputEnergi').value;
    const fokus = document.getElementById('inputFokus').value;

    document.getElementById('valueStres').textContent = stres + '/10';
    document.getElementById('valueMood').textContent = mood + '/10';
    document.getElementById('valueEnergi').textContent = energi + '/10';
    document.getElementById('valueFokus').textContent = fokus + '/10';

    // Emoji
    document.getElementById('emojiStres').textContent = stres <= 3 ? '😌' : stres <= 6 ? '😐' : '😰';
    document.getElementById('emojiMood').textContent = mood >= 8 ? '😄' : mood >= 5 ? '🙂' : '😔';
    document.getElementById('emojiEnergi').textContent = energi >= 7 ? '🔋' : energi >= 4 ? '⚡' : '🪫';
    document.getElementById('emojiFokus').textContent = fokus >= 7 ? '🎯' : fokus >= 4 ? '🎯' : '🌀';

    // Indikator keseluruhan
    const rataRata = (parseInt(stres) + parseInt(mood) + parseInt(energi) + parseInt(fokus)) / 4;
    const indikator = document.getElementById('indikatorPsikis');
    if (rataRata >= 7) {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-green-50 text-green-700';
        indikator.textContent = '💪 Kondisi psikis sangat baik! Cocok untuk tugas berat.';
    } else if (rataRata >= 5) {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-yellow-50 text-yellow-700';
        indikator.textContent = '🙂 Kondisi psikis stabil. Tetap jaga ritme.';
    } else {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-red-50 text-red-700';
        indikator.textContent = '⚠️ Kondisi psikis menurun. Disarankan istirahat dan kurangi beban.';
    }
}

// ==================== RENDER KEBIASAAN ====================
let kebiasaanBaikTerpilih = [];
let kebiasaanBurukTerpilih = [];

function renderDaftarKebiasaan(profil) {
    const containerBaik = document.getElementById('habitsBaikContainer');
    const containerBuruk = document.getElementById('habitsBurukContainer');

    if (profil && profil.kebiasaan) {
        containerBaik.innerHTML = profil.kebiasaan.baik.map((k, index) => `
            <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition">
                <input type="checkbox" class="kebiasaan-baik-check accent-green-600" data-nama="${k.nama}" data-poin="${k.poin}" onchange="toggleKebiasaanBaik(this)" />
                <div class="flex-1">
                    <p class="text-sm text-gray-700">${k.nama}</p>
                    <p class="text-xs text-green-600 font-semibold">+${k.poin} poin</p>
                </div>
            </label>
        `).join('');

        containerBuruk.innerHTML = profil.kebiasaan.buruk.map((k, index) => `
            <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-red-50 transition">
                <input type="checkbox" class="kebiasaan-buruk-check accent-red-600" data-nama="${k.nama}" data-poin="${k.poin}" onchange="toggleKebiasaanBuruk(this)" />
                <div class="flex-1">
                    <p class="text-sm text-gray-700">${k.nama}</p>
                    <p class="text-xs text-red-600 font-semibold">${k.poin} poin</p>
                </div>
            </label>
        `).join('');
    }
}

function toggleKebiasaanBaik(checkbox) {
    if (checkbox.checked) {
        kebiasaanBaikTerpilih.push({ nama: checkbox.dataset.nama, poin: parseInt(checkbox.dataset.poin) });
    } else {
        kebiasaanBaikTerpilih = kebiasaanBaikTerpilih.filter(k => k.nama !== checkbox.dataset.nama);
    }
}

function toggleKebiasaanBuruk(checkbox) {
    if (checkbox.checked) {
        kebiasaanBurukTerpilih.push({ nama: checkbox.dataset.nama, poin: parseInt(checkbox.dataset.poin) });
    } else {
        kebiasaanBurukTerpilih = kebiasaanBurukTerpilih.filter(k => k.nama !== checkbox.dataset.nama);
    }
}

// ==================== PILIH STATUS ====================
let statusTerpilih = '';

function setStatus(btn) {
    // Reset semua tombol
    document.querySelectorAll('.status-btn').forEach(b => {
        b.classList.remove('border-green-500', 'bg-green-50', 'border-amber-500', 'bg-amber-50', 'border-red-500', 'bg-red-50');
    });
    // Set tombol aktif
    if (btn.dataset.status === 'done') {
        btn.classList.add('border-green-500', 'bg-green-50');
    } else if (btn.dataset.status === 'partial') {
        btn.classList.add('border-amber-500', 'bg-amber-50');
    } else if (btn.dataset.status === 'skipped') {
        btn.classList.add('border-red-500', 'bg-red-50');
    }
    statusTerpilih = btn.dataset.status;
}

// ==================== SIMPAN CHECK-IN ====================
function simpanCheckIn() {
    const profil = getProfil();
    if (!profil) return;

    const intentionText = document.getElementById('intentionText').value.trim();
    if (!intentionText) {
        alert('Isi dulu rencanamu hari ini!');
        return;
    }
    if (!statusTerpilih) {
        alert('Pilih status pelaksanaan: Selesai, Sebagian, atau Dilewati.');
        return;
    }

    // Ambil nilai psikis
    const stres = parseInt(document.getElementById('inputStres').value);
    const mood = parseInt(document.getElementById('inputMood').value);
    const energi = parseInt(document.getElementById('inputEnergi').value);
    const fokus = parseInt(document.getElementById('inputFokus').value);

    // Hitung poin kebiasaan
    const totalPoinBaik = kebiasaanBaikTerpilih.reduce((sum, k) => sum + k.poin, 0);
    const totalPoinBuruk = kebiasaanBurukTerpilih.reduce((sum, k) => sum + k.poin, 0); // poin negatif
    const poinHarian = totalPoinBaik + totalPoinBuruk; // buruk sudah negatif

    // Hitung persentase penyelesaian (perkiraan: berdasarkan status)
    let persentase = 0;
    if (statusTerpilih === 'done') persentase = 1.0;
    else if (statusTerpilih === 'partial') persentase = 0.5;
    else persentase = 0.0; // skipped

    // Tentukan apakah berhasil (≥70%)
    const apakahBerhasil = persentase >= 0.7;

    // Hitung estimasi tanggal baru (dari riwayat sebelumnya)
    const riwayat = getRiwayat();
    let estimasiTanggal = profil.targetDate;
    if (riwayat.length > 0) {
        estimasiTanggal = riwayat[riwayat.length - 1].estimasi_tanggal;
    }
    // Tambah penalti
    if (statusTerpilih === 'skipped') {
        estimasiTanggal = tambahHari(estimasiTanggal, PENALTI_SKIPPED);
    } else if (statusTerpilih === 'partial') {
        estimasiTanggal = tambahHari(estimasiTanggal, PENALTI_PARTIAL);
    }

    // Hitung risk score sederhana (0-100)
    const riskScore = hitungRiskScoreSederhana(statusTerpilih, stres, mood, energi, fokus, totalPoinBuruk);

    // Data yang akan disimpan
    const dataCheckIn = {
        tanggal: formatTanggal(),
        hari_ke: hitungHariKe(profil.tanggalOnboarding || formatTanggal()),
        hari_dalam_minggu: new Date().getDay(), // 0=Minggu
        jam_checkin: new Date().toTimeString().slice(0,5),
        jumlah_intention: 1, // sementara 1, bisa dikembangkan
        intention_text: intentionText,
        jam_direncanakan: profil.jamProduktif || 4,
        jam_aktual: statusTerpilih === 'done' ? (profil.jamProduktif || 4) : (statusTerpilih === 'partial' ? (profil.jamProduktif || 4) * 0.5 : 0),
        status_checkin: statusTerpilih,
        persentase_penyelesaian: persentase,
        stres_level: stres,
        mood_level: mood,
        energi_level: energi,
        fokus_level: fokus,
        jumlah_kebiasaan_baik: kebiasaanBaikTerpilih.length,
        poin_kebiasaan_baik: totalPoinBaik,
        jumlah_kebiasaan_buruk: kebiasaanBurukTerpilih.length,
        poin_kebiasaan_buruk: totalPoinBuruk,
        detail_kebiasaan_buruk: kebiasaanBurukTerpilih.map(k => k.nama).join(', '),
        ada_gangguan: false, // bisa ditambahkan inputan
        jenis_gangguan: '',
        progress_goal: hitungProgressGoal(riwayat),
        risk_score_rule: riskScore,
        estimasi_mundur_hari: (statusTerpilih === 'skipped') ? PENALTI_SKIPPED : (statusTerpilih === 'partial' ? PENALTI_PARTIAL : 0),
        poin_harian: poinHarian,
        poin_total: riwayat.reduce((sum, r) => sum + r.poin_harian, 0) + poinHarian,
        refleksi: document.getElementById('refleksiText').value.trim(),
        estimasi_tanggal: estimasiTanggal,
        apakah_berhasil: apakahBerhasil,
    };

    // Simpan ke riwayat
    riwayat.push(dataCheckIn);
    saveRiwayat(riwayat);

    // Tampilkan dampak jika ada
    if (statusTerpilih !== 'done') {
        document.getElementById('dampakSection').classList.remove('hidden');
        document.getElementById('dampakHari').textContent = '+' + dataCheckIn.estimasi_mundur_hari + ' hari';
        document.getElementById('dampakPoin').textContent = (totalPoinBuruk < 0 ? totalPoinBuruk : 0) + ' poin';
        if (statusTerpilih === 'skipped') {
            document.getElementById('dampakText').textContent = 'Kamu melewatkan rencana hari ini. Estimasi pencapaian target mundur ' + PENALTI_SKIPPED + ' hari.';
        } else {
            document.getElementById('dampakText').textContent = 'Kamu hanya menyelesaikan sebagian rencana. Estimasi mundur ' + PENALTI_PARTIAL + ' hari.';
        }
    } else {
        document.getElementById('dampakSection').classList.add('hidden');
    }

    // Update tampilan estimasi & poin
    document.getElementById('estimasiDisplay').textContent = estimasiTanggal;
    document.getElementById('poinTotal').textContent = dataCheckIn.poin_total;

    // Reset form
    document.getElementById('intentionText').value = '';
    document.getElementById('refleksiText').value = '';
    document.querySelectorAll('.status-btn').forEach(b => {
        b.classList.remove('border-green-500', 'bg-green-50', 'border-amber-500', 'bg-amber-50', 'border-red-500', 'bg-red-50');
    });
    statusTerpilih = '';
    kebiasaanBaikTerpilih = [];
    kebiasaanBurukTerpilih = [];
    document.querySelectorAll('.kebiasaan-baik-check, .kebiasaan-buruk-check').forEach(cb => cb.checked = false);

    alert('Check-in berhasil disimpan!');
    // Reload data dashboard (opsional)
    location.reload();
}

// ==================== FUNGSI PENDUKUNG ====================
function tambahHari(tanggalStr, jumlahHari) {
    const tanggal = new Date(tanggalStr);
    tanggal.setDate(tanggal.getDate() + jumlahHari);
    return formatTanggal(tanggal);
}

function hitungRiskScoreSederhana(status, stres, mood, energi, fokus, poinBuruk) {
    // Aturan sederhana: makin buruk kondisi, makin tinggi risk
    let score = 0;
    if (status === 'skipped') score += 40;
    else if (status === 'partial') score += 20;

    score += Math.max(0, (stres - 5) * 3); // stres > 5 menambah risk
    score += Math.max(0, (5 - mood) * 2);
    score += Math.max(0, (5 - energi) * 2);
    score += Math.max(0, (5 - fokus) * 2);
    score += Math.abs(poinBuruk) * 0.5; // kebiasaan buruk menambah risk

    return Math.min(100, Math.round(score));
}

function hitungProgressGoal(riwayat) {
    // Perkiraan: hari ke berjalan dibagi total hari target (dari onboarding)
    const profil = getProfil();
    if (!profil || !profil.targetDate) return 0;
    const mulai = new Date(profil.tanggalOnboarding || Date.now());
    const target = new Date(profil.targetDate);
    const totalHari = Math.max(1, (target - mulai) / (1000 * 60 * 60 * 24));
    const hariIni = hitungHariKe(profil.tanggalOnboarding || formatTanggal());
    const progress = Math.min(1, hariIni / totalHari);
    return progress;
}

// ==================== CHAT AI (DUMMY) ====================
function kirimChat() {
    const input = document.getElementById('chatInput');
    const pesan = input.value.trim();
    if (!pesan) return;

    const chatBox = document.getElementById('aiChatBox');
    chatBox.innerHTML += `<p class="mt-2"><strong>Kamu:</strong> ${pesan}</p>`;
    input.value = '';

    // Respon dummy (nanti diganti API ML)
    setTimeout(() => {
        chatBox.innerHTML += `<p class="mt-2"><strong>AI Coach:</strong> Maaf, analisis mendalam akan tersedia setelah model ML terintegrasi. Tetap semangat!</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
}
