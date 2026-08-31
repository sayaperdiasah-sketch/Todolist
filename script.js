// =============================================
// script.js — Jejak Menuju Target (Updated)
// =============================================

// ==================== KONSTANTA ====================
const STORAGE_KEY_PROFIL = 'profilUser';
const STORAGE_KEY_RIWAYAT = 'riwayatCheckIn';
const PENALTI_SKIPPED = 2; // hari
const PENALTI_PARTIAL = 1; // hari

const HABITS_BAIK_DEFAULT = [
    { nama: 'Olahraga pagi', poin: 3 },
    { nama: 'Meditasi', poin: 3 },
    { nama: 'Baca buku', poin: 3 },
    { nama: 'Journaling', poin: 3 },
    { nama: 'Makan sehat', poin: 3 },
    { nama: 'Tidur cukup', poin: 4 },
    { nama: 'Belajar terstruktur', poin: 5 },
    { nama: 'Prospek klien', poin: 5 }
];

const HABITS_BURUK_DEFAULT = [
    { nama: 'Scroll media sosial berlebihan', poin: -3 },
    { nama: 'Tidur larut', poin: -4 },
    { nama: 'Makan tidak sehat', poin: -2 },
    { nama: 'Menunda pekerjaan', poin: -5 },
    { nama: 'Stres berlebihan', poin: -3 },
    { nama: 'Kurang gerak', poin: -2 }
];

// ==================== UTILITAS ====================
function getProfil() {
    let profil = JSON.parse(localStorage.getItem(STORAGE_KEY_PROFIL));
    if (!profil) {
        profil = {
            nama: 'User',
            target: '🏃 Lari 5 km nonstop',
            targetDate: '2025-12-31',
            tanggalOnboarding: new Date().toISOString().split('T')[0],
            jamProduktif: 4,
            baseline: { stres: 3, mood: 7, energi: 6, fokus: 5 },
            kebiasaan: {
                baik: HABITS_BAIK_DEFAULT,
                buruk: HABITS_BURUK_DEFAULT
            }
        };
        localStorage.setItem(STORAGE_KEY_PROFIL, JSON.stringify(profil));
    }
    return profil;
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

function tambahHari(tanggalStr, jumlahHari) {
    const tanggal = new Date(tanggalStr);
    tanggal.setDate(tanggal.getDate() + jumlahHari);
    return formatTanggal(tanggal);
}

// ==================== STATE ====================
let selectedStatus = null;
let kebiasaanBaikTerpilih = [];
let kebiasaanBurukTerpilih = [];

// ==================== INISIALISASI DASHBOARD ====================
document.addEventListener('DOMContentLoaded', function() {
    const profil = getProfil();

    // Tampilkan nama dan target
    document.getElementById('namaUser').textContent = profil.nama || 'User';
    document.getElementById('targetUtama').textContent = profil.target || '-';
    document.getElementById('targetDateDisplay').textContent = profil.targetDate || '-';

    // Estimasi
    const riwayat = getRiwayat();
    const estimasi = riwayat.length > 0
        ? riwayat[riwayat.length - 1].estimasi_tanggal
        : profil.targetDate;
    document.getElementById('estimasiDisplay').textContent = estimasi;

    // Poin total
    const poinTotal = riwayat.reduce((sum, r) => sum + (r.poin_harian || 0), 0);
    document.getElementById('poinTotal').textContent = poinTotal;

    // Tanggal hari ini (real-time)
    const tanggalEl = document.getElementById('tanggalHariIni');
    function updateTanggal() {
        tanggalEl.textContent = new Date().toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    updateTanggal();
    setInterval(updateTanggal, 1000); // update setiap detik

    // Set nilai default slider psikis dari baseline profil
    if (profil.baseline) {
        document.getElementById('inputStres').value = profil.baseline.stres || 3;
        document.getElementById('inputMood').value = profil.baseline.mood || 7;
        document.getElementById('inputEnergi').value = profil.baseline.energi || 6;
        document.getElementById('inputFokus').value = profil.baseline.fokus || 5;
        updatePsikis();
    }

    // Render daftar kebiasaan
    renderDaftarKebiasaan(profil);

    // Load data terakhir
    loadLastData();

    // Update ringkasan & poin
    updateRingkasan();
});

// ==================== UPDATE PSIKIS ====================
function updatePsikis() {
    const stres = parseInt(document.getElementById('inputStres').value);
    const mood = parseInt(document.getElementById('inputMood').value);
    const energi = parseInt(document.getElementById('inputEnergi').value);
    const fokus = parseInt(document.getElementById('inputFokus').value);

    document.getElementById('valueStres').textContent = stres + '/10';
    document.getElementById('valueMood').textContent = mood + '/10';
    document.getElementById('valueEnergi').textContent = energi + '/10';
    document.getElementById('valueFokus').textContent = fokus + '/10';

    document.getElementById('emojiStres').textContent = stres <= 3 ? '😌' : stres <= 6 ? '😐' : '😰';
    document.getElementById('emojiMood').textContent = mood >= 7 ? '😄' : mood >= 4 ? '🙂' : '😞';
    document.getElementById('emojiEnergi').textContent = energi >= 7 ? '⚡' : energi >= 4 ? '🔋' : '🪫';
    document.getElementById('emojiFokus').textContent = fokus >= 7 ? '🎯' : fokus >= 4 ? '📌' : '🌀';

    const rataRata = (stres + mood + energi + fokus) / 4;
    const indikator = document.getElementById('indikatorPsikis');
    if (rataRata >= 7) {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-green-50 text-green-700 border border-green-200';
        indikator.textContent = '🌟 Kondisi psikis sangat baik! Pertahankan.';
    } else if (rataRata >= 5) {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200';
        indikator.textContent = '📈 Kondisi cukup, ada ruang untuk perbaikan.';
    } else {
        indikator.className = 'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-red-50 text-red-700 border border-red-200';
        indikator.textContent = '⚠️ Perhatikan keseimbangan psikismu. Istirahat sejenak.';
    }
}

// ==================== RENDER KEBIASAAN ====================
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
function setStatus(btn) {
    document.querySelectorAll('.status-btn').forEach(b => {
        b.classList.remove('border-green-500', 'bg-green-50', 'border-amber-500', 'bg-amber-50', 'border-red-500', 'bg-red-50');
    });
    if (btn.dataset.status === 'done') {
        btn.classList.add('border-green-500', 'bg-green-50');
    } else if (btn.dataset.status === 'partial') {
        btn.classList.add('border-amber-500', 'bg-amber-50');
    } else if (btn.dataset.status === 'skipped') {
        btn.classList.add('border-red-500', 'bg-red-50');
    }
    selectedStatus = btn.dataset.status;
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
    if (!selectedStatus) {
        alert('Pilih status pelaksanaan: Selesai, Sebagian, atau Dilewati.');
        return;
    }

    const screenTime = parseFloat(document.getElementById('screenTime').value) || 0;
    const jamTidur = parseFloat(document.getElementById('jamTidur').value) || 0;

    if (screenTime < 0 || screenTime > 24 || jamTidur < 0 || jamTidur > 24) {
        alert('Masukkan angka yang wajar untuk screen time dan tidur.');
        return;
    }

    const stres = parseInt(document.getElementById('inputStres').value);
    const mood = parseInt(document.getElementById('inputMood').value);
    const energi = parseInt(document.getElementById('inputEnergi').value);
    const fokus = parseInt(document.getElementById('inputFokus').value);

    // ===== Perhitungan Poin =====
    let totalPoinBaik = kebiasaanBaikTerpilih.reduce((sum, k) => sum + k.poin, 0);
    let totalPoinBuruk = kebiasaanBurukTerpilih.reduce((sum, k) => sum + k.poin, 0); // poin negatif

    let poinScreen = 0;
    let poinTidur = 0;
    const detailBaikTambahan = [];
    const detailBurukTambahan = [];

    if (screenTime > 10) {
        poinScreen = -5;
        detailBurukTambahan.push(`Screen time ${screenTime} jam (>10 jam)`);
    } else if (screenTime > 8) {
        poinScreen = -3;
        detailBurukTambahan.push(`Screen time ${screenTime} jam (>8 jam)`);
    } else if (screenTime > 0 && screenTime < 4) {
        poinScreen = 5;
        detailBaikTambahan.push(`Screen time ${screenTime} jam (<4 jam)`);
    }

    if (jamTidur < 6 && jamTidur > 0) {
        poinTidur = -4;
        detailBurukTambahan.push(`Tidur ${jamTidur} jam (<6 jam)`);
    } else if (jamTidur >= 7 && jamTidur <= 9) {
        poinTidur = 3;
        detailBaikTambahan.push(`Tidur ${jamTidur} jam (ideal)`);
    }

    totalPoinBaik += poinScreen > 0 ? poinScreen : 0;
    totalPoinBuruk += poinScreen < 0 ? poinScreen : 0;
    totalPoinBaik += poinTidur > 0 ? poinTidur : 0;
    totalPoinBuruk += poinTidur < 0 ? poinTidur : 0;

    // Poin status
    let poinStatus = 0;
    if (selectedStatus === 'done') poinStatus = 10;
    else if (selectedStatus === 'partial') poinStatus = 5;
    else poinStatus = -5;

    // Poin psikis
    const avgPsikis = (stres + mood + energi + fokus) / 4;
    let poinPsikis = 0;
    if (avgPsikis >= 7) poinPsikis = 5;
    else if (avgPsikis <= 3) poinPsikis = -3;

    const poinHarian = totalPoinBaik + totalPoinBuruk + poinStatus + poinPsikis;

    // Gabungkan detail kebiasaan
    const detailBaik = kebiasaanBaikTerpilih.map(k => k.nama).concat(detailBaikTambahan).join(', ');
    const detailBuruk = kebiasaanBurukTerpilih.map(k => k.nama).concat(detailBurukTambahan).join(', ');

    // ===== Estimasi tanggal =====
    const riwayat = getRiwayat();
    let estimasiTanggal = profil.targetDate;
    if (riwayat.length > 0) {
        estimasiTanggal = riwayat[riwayat.length - 1].estimasi_tanggal;
    }

    let penaltiHari = 0;
    if (selectedStatus === 'skipped') {
        penaltiHari = PENALTI_SKIPPED;
        estimasiTanggal = tambahHari(estimasiTanggal, PENALTI_SKIPPED);
    } else if (selectedStatus === 'partial') {
        penaltiHari = PENALTI_PARTIAL;
        estimasiTanggal = tambahHari(estimasiTanggal, PENALTI_PARTIAL);
    }

    // ===== Risk Score =====
    let riskScore = 0;
    if (selectedStatus === 'skipped') riskScore += 40;
    else if (selectedStatus === 'partial') riskScore += 20;
    riskScore += Math.max(0, (stres - 5) * 3);
    riskScore += Math.max(0, (5 - mood) * 2);
    riskScore += Math.max(0, (5 - energi) * 2);
    riskScore += Math.max(0, (5 - fokus) * 2);
    riskScore += Math.abs(totalPoinBuruk) * 0.5;
    if (screenTime > 8) riskScore += 10;
    if (jamTidur < 6 && jamTidur > 0) riskScore += 15;
    riskScore = Math.min(100, Math.round(riskScore));

    // ===== Data check-in =====
    const dataCheckIn = {
        tanggal: formatTanggal(),
        hari_ke: hitungHariKe(profil.tanggalOnboarding || formatTanggal()),
        hari_dalam_minggu: new Date().getDay(),
        jam_checkin: new Date().toTimeString().slice(0, 5),
        jumlah_intention: 1,
        intention_text: intentionText,
        jam_direncanakan: profil.jamProduktif || 4,
        jam_aktual: selectedStatus === 'done' ? (profil.jamProduktif || 4) : (selectedStatus === 'partial' ? (profil.jamProduktif || 4) * 0.5 : 0),
        status_checkin: selectedStatus,
        persentase_penyelesaian: selectedStatus === 'done' ? 1.0 : (selectedStatus === 'partial' ? 0.5 : 0.0),
        screen_time: screenTime,
        jam_tidur: jamTidur,
        stres_level: stres,
        mood_level: mood,
        energi_level: energi,
        fokus_level: fokus,
        jumlah_kebiasaan_baik: kebiasaanBaikTerpilih.length + detailBaikTambahan.length,
        poin_kebiasaan_baik: totalPoinBaik,
        jumlah_kebiasaan_buruk: kebiasaanBurukTerpilih.length + detailBurukTambahan.length,
        poin_kebiasaan_buruk: totalPoinBuruk,
        detail_kebiasaan_buruk: detailBuruk,
        detail_kebiasaan_baik: detailBaik,
        ada_gangguan: false,
        jenis_gangguan: '',
        progress_goal: hitungProgressGoal(riwayat),
        risk_score_rule: riskScore,
        estimasi_mundur_hari: penaltiHari,
        poin_harian: poinHarian,
        poin_total: riwayat.reduce((sum, r) => sum + (r.poin_harian || 0), 0) + poinHarian,
        refleksi: document.getElementById('refleksiText').value.trim(),
        estimasi_tanggal: estimasiTanggal,
        apakah_berhasil: selectedStatus === 'done' || (selectedStatus === 'partial' && 0.5 >= 0.7) ? true : false
    };

    // Simpan
    riwayat.push(dataCheckIn);
    saveRiwayat(riwayat);

    // Tampilkan dampak
    const dampakSection = document.getElementById('dampakSection');
    if (selectedStatus !== 'done') {
        dampakSection.classList.remove('hidden');
        document.getElementById('dampakHari').textContent = '+' + penaltiHari + ' hari';
        document.getElementById('dampakPoin').textContent = (totalPoinBuruk < 0 ? totalPoinBuruk : 0) + ' poin';
        document.getElementById('dampakText').textContent =
            selectedStatus === 'skipped'
            ? 'Kamu melewatkan rencana hari ini. Estimasi pencapaian target mundur ' + penaltiHari + ' hari.'
            : 'Kamu hanya menyelesaikan sebagian rencana. Estimasi mundur ' + penaltiHari + ' hari.';
    } else {
        dampakSection.classList.add('hidden');
    }

    // Update UI
    document.getElementById('estimasiDisplay').textContent = estimasiTanggal;
    document.getElementById('poinTotal').textContent = dataCheckIn.poin_total;
    updateRingkasan();
    tampilkanAICoach(dataCheckIn);

    // Peringatan
    tampilkanPeringatan(screenTime, jamTidur);

    // Reset form
    document.getElementById('intentionText').value = '';
    document.getElementById('refleksiText').value = '';
    document.getElementById('screenTime').value = '';
    document.getElementById('jamTidur').value = '';
    document.querySelectorAll('.status-btn').forEach(b => {
        b.classList.remove('border-green-500', 'bg-green-50', 'border-amber-500', 'bg-amber-50', 'border-red-500', 'bg-red-50');
    });
    selectedStatus = null;
    kebiasaanBaikTerpilih = [];
    kebiasaanBurukTerpilih = [];
    document.querySelectorAll('.kebiasaan-baik-check, .kebiasaan-buruk-check').forEach(cb => cb.checked = false);

    alert('✅ Check-in berhasil disimpan!');
    location.reload(); // agar data langsung termuat
}

// ==================== PERINGATAN ====================
function tampilkanPeringatan(screenTime, jamTidur) {
    const container = document.getElementById('warningContainer');
    const text = document.getElementById('warningText');
    if (!container || !text) return;
    const warnings = [];
    if (screenTime > 8) warnings.push(`Screen time ${screenTime} jam – kurangi!`);
    if (jamTidur < 6 && jamTidur > 0) warnings.push(`Tidur ${jamTidur} jam – kurang!`);
    if (warnings.length > 0) {
        container.classList.remove('hidden');
        text.textContent = warnings.join(' ');
    } else {
        container.classList.add('hidden');
    }
}

// ==================== UPDATE RINGKASAN ====================
function updateRingkasan() {
    const riwayat = getRiwayat();
    if (riwayat.length === 0) {
        document.getElementById('avgStress').textContent = '-';
        document.getElementById('avgMood').textContent = '-';
        document.getElementById('avgEnergi').textContent = '-';
        document.getElementById('avgFokus').textContent = '-';
        return;
    }
    const latest = riwayat[riwayat.length - 1];
    document.getElementById('avgStress').textContent = latest.stres_level || '-';
    document.getElementById('avgMood').textContent = latest.mood_level || '-';
    document.getElementById('avgEnergi').textContent = latest.energi_level || '-';
    document.getElementById('avgFokus').textContent = latest.fokus_level || '-';
}

// ==================== AI COACH ====================
function tampilkanAICoach(data) {
    const box = document.getElementById('aiChatBox');
    let saran = '';
    if (data.stres_level > 7) saran += '⚠️ Stres tinggi, coba teknik pernapasan. ';
    if (data.mood_level < 4) saran += '😔 Mood rendah, lakukan aktivitas menyenangkan. ';
    if (data.energi_level < 4) saran += '🪫 Energi rendah, pastikan tidur & makan. ';
    if (data.fokus_level < 4) saran += '🌀 Fokus rendah, gunakan Pomodoro. ';
    if (data.screen_time > 8) saran += `📱 Screen time ${data.screen_time} jam, kurangi untuk produktivitas. `;
    if (data.jam_tidur < 6 && data.jam_tidur > 0) saran += `😴 Tidur ${data.jam_tidur} jam, usahakan 7-8 jam. `;
    if (data.status_checkin === 'done') saran += '✅ Bagus! Rencana selesai. ';
    else if (data.status_checkin === 'partial') saran += '◐ Sebagian selesai, identifikasi hambatan. ';
    else saran += '❌ Hari terlewat, besok mulai lagi. ';
    if (data.detail_kebiasaan_baik) saran += `Baik: ${data.detail_kebiasaan_baik}. `;
    if (data.detail_kebiasaan_buruk) saran += `Buruk: ${data.detail_kebiasaan_buruk}. `;
    box.innerHTML = `<p class="text-gray-700">${saran}</p>`;
}

// ==================== LOAD DATA TERAKHIR ====================
function loadLastData() {
    const riwayat = getRiwayat();
    if (riwayat.length === 0) return;
    const last = riwayat[riwayat.length - 1];

    document.getElementById('intentionText').value = last.intention_text || '';
    document.getElementById('refleksiText').value = last.refleksi || '';
    document.getElementById('screenTime').value = last.screen_time || '';
    document.getElementById('jamTidur').value = last.jam_tidur || '';

    if (last.status_checkin) {
        const btn = document.querySelector(`.status-btn[data-status="${last.status_checkin}"]`);
        if (btn) setStatus(btn);
    }

    if (last.stres_level) {
        document.getElementById('inputStres').value = last.stres_level;
        document.getElementById('inputMood').value = last.mood_level;
        document.getElementById('inputEnergi').value = last.energi_level;
        document.getElementById('inputFokus').value = last.fokus_level;
        updatePsikis();
    }

    // Kebiasaan
    if (last.detail_kebiasaan_baik) {
        const arr = last.detail_kebiasaan_baik.split(', ');
        document.querySelectorAll('#habitsBaikContainer input[type="checkbox"]').forEach(cb => {
            const label = cb.dataset.nama;
            if (arr.includes(label)) {
                cb.checked = true;
                kebiasaanBaikTerpilih.push({ nama: label, poin: parseInt(cb.dataset.poin) });
            }
        });
    }
    if (last.detail_kebiasaan_buruk) {
        const arr = last.detail_kebiasaan_buruk.split(', ');
        document.querySelectorAll('#habitsBurukContainer input[type="checkbox"]').forEach(cb => {
            const label = cb.dataset.nama;
            if (arr.includes(label)) {
                cb.checked = true;
                kebiasaanBurukTerpilih.push({ nama: label, poin: parseInt(cb.dataset.poin) });
            }
        });
    }

    tampilkanAICoach(last);
    tampilkanPeringatan(last.screen_time || 0, last.jam_tidur || 0);
    if (last.status_checkin !== 'done') {
        document.getElementById('dampakSection').classList.remove('hidden');
        document.getElementById('dampakHari').textContent = `+${last.estimasi_mundur_hari || 0} hari`;
        document.getElementById('dampakPoin').textContent = `${last.poin_kebiasaan_buruk || 0} poin`;
        document.getElementById('dampakText').textContent =
            last.status_checkin === 'skipped'
            ? 'Kamu melewatkan rencana hari ini.'
            : 'Kamu hanya menyelesaikan sebagian rencana.';
    }
}

// ==================== CHAT ====================
function kirimChat() {
    const input = document.getElementById('chatInput');
    const pesan = input.value.trim();
    if (!pesan) return;
    const box = document.getElementById('aiChatBox');
    box.innerHTML += `<p class="mt-2"><strong>Kamu:</strong> ${pesan}</p>`;
    input.value = '';
    setTimeout(() => {
        box.innerHTML += `<p class="mt-2"><strong>AI Coach:</strong> Terima kasih atas pertanyaanmu. Saya sarankan fokus pada satu kebiasaan kecil untuk diperbaiki. Tetap semangat!</p>`;
        box.scrollTop = box.scrollHeight;
    }, 500);
}

// ==================== RESET ====================
function resetData() {
    if (confirm('Yakin ingin menghapus semua data check-in dan profil?')) {
        localStorage.removeItem(STORAGE_KEY_PROFIL);
        localStorage.removeItem(STORAGE_KEY_RIWAYAT);
        location.reload();
    }
}
