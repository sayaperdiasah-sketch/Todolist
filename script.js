// =============================================
// script.js — Jejak Menuju Target
// Real-Time WIB + Local Date Safe
// =============================================
// ==================== KONSTANTA ====================
const STORAGE_KEY_PROFIL = 'profilUser';
const STORAGE_KEY_RIWAYAT = 'riwayatCheckIn';
const PENALTI_SKIPPED = 2;
const PENALTI_PARTIAL = 1;
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
// ==================== STATE ====================
let selectedStatus = null;
let kebiasaanBaikTerpilih = [];
let kebiasaanBurukTerpilih = [];
// ==================== WAKTU / TANGGAL ====================
/**
 * Mengambil waktu sekarang dari perangkat/browser.
 * Semua fungsi tanggal aplikasi menggunakan waktu lokal.
 */
function getWaktuSekarang() {
    return new Date();
}
/**
 * Format tanggal lokal:
 * YYYY-MM-DD
 *
 * Tidak menggunakan toISOString()
 * agar tidak terkena pergeseran UTC.
 */
function formatTanggal(date = getWaktuSekarang()) {
    const tahun = date.getFullYear();
    const bulan = String(date.getMonth() + 1).padStart(2, '0');
    const hari = String(date.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${hari}`;
}
/**
 * Format jam lokal:
 * HH:MM
 */
function formatJam(date = getWaktuSekarang()) {
    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');
    return `${jam}:${menit}`;
}
/**
 * Format tanggal + jam real-time Indonesia.
 */
function formatTanggalWaktu(date = getWaktuSekarang()) {
    return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
/**
 * Menghitung hari ke-n sejak onboarding.
 */
function hitungHariKe(
    tanggalMulai,
    tanggalSekarang = getWaktuSekarang()
) {
    if (!tanggalMulai) return 1;
    const bagianTanggal = tanggalMulai.split('-').map(Number);
    if (bagianTanggal.length !== 3) return 1;
    const [tahun, bulan, hari] = bagianTanggal;
    // Buat tanggal lokal, bukan UTC
    const mulai = new Date(
        tahun,
        bulan - 1,
        hari
    );
    const sekarang = new Date(
        tanggalSekarang.getFullYear(),
        tanggalSekarang.getMonth(),
        tanggalSekarang.getDate()
    );
    const diff = Math.floor(
        (sekarang - mulai) /
        (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff + 1);
}
/**
 * Menambahkan jumlah hari ke tanggal YYYY-MM-DD.
 */
function tambahHari(tanggalStr, jumlahHari) {
    if (!tanggalStr) {
        return formatTanggal();
    }
    const [tahun, bulan, hari] =
        tanggalStr.split('-').map(Number);
    const tanggal = new Date(
        tahun,
        bulan - 1,
        hari
    );
    tanggal.setDate(
        tanggal.getDate() + jumlahHari
    );
    return formatTanggal(tanggal);
}
// ==================== PROFIL ====================
function getProfil() {
    let profil = JSON.parse(
        localStorage.getItem(STORAGE_KEY_PROFIL)
    );
    if (!profil) {
        profil = {
            nama: 'User',
            target: '🏃 Lari 5 km nonstop',
            // Target baru
            targetDate: '2026-12-31',
            // Otomatis mengikuti tanggal saat pertama kali aplikasi dibuat
            tanggalOnboarding: formatTanggal(),
            jamProduktif: 4,
            baseline: {
                stres: 3,
                mood: 7,
                energi: 6,
                fokus: 5
            },
            kebiasaan: {
                baik: HABITS_BAIK_DEFAULT,
                buruk: HABITS_BURUK_DEFAULT
            }
        };
        localStorage.setItem(
            STORAGE_KEY_PROFIL,
            JSON.stringify(profil)
        );
    }
    // Proteksi jika profil lama belum punya kebiasaan
    if (!profil.kebiasaan) {
        profil.kebiasaan = {
            baik: HABITS_BAIK_DEFAULT,
            buruk: HABITS_BURUK_DEFAULT
        };
    }
    return profil;
}
// ==================== RIWAYAT ====================
function getRiwayat() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY_RIWAYAT)
    ) || [];
}
function saveRiwayat(riwayat) {
    localStorage.setItem(
        STORAGE_KEY_RIWAYAT,
        JSON.stringify(riwayat)
    );
}
// ==================== INISIALISASI ====================
document.addEventListener(
    'DOMContentLoaded',
    function () {
        const profil = getProfil();
        // ====================
        // PROFIL
        // ====================
        const namaUser =
            document.getElementById('namaUser');
        const targetUtama =
            document.getElementById('targetUtama');
        const targetDateDisplay =
            document.getElementById('targetDateDisplay');
        if (namaUser) {
            namaUser.textContent =
                profil.nama || 'User';
        }
        if (targetUtama) {
            targetUtama.textContent =
                profil.target || '-';
        }
        if (targetDateDisplay) {
            targetDateDisplay.textContent =
                profil.targetDate || '-';
        }
        // ====================
        // ESTIMASI
        // ====================
        const riwayat = getRiwayat();
        const estimasi =
            riwayat.length > 0
                ? riwayat[riwayat.length - 1]
                    .estimasi_tanggal
                : profil.targetDate;
        const estimasiDisplay =
            document.getElementById(
                'estimasiDisplay'
            );
        if (estimasiDisplay) {
            estimasiDisplay.textContent =
                estimasi || '-';
        }
        // ====================
        // POIN TOTAL
        // ====================
        updatePoinTotal();
        // ====================
        // JAM & TANGGAL REAL-TIME
        // ====================
        const tanggalEl =
            document.getElementById(
                'tanggalHariIni'
            );
        function updateTanggal() {
            if (!tanggalEl) return;
            tanggalEl.textContent =
                formatTanggalWaktu();
        }
        updateTanggal();
        // Update setiap detik
        setInterval(
            updateTanggal,
            1000
        );
        // ====================
        // BASELINE PSIKIS
        // ====================
        if (profil.baseline) {
            const inputStres =
                document.getElementById(
                    'inputStres'
                );
            const inputMood =
                document.getElementById(
                    'inputMood'
                );
            const inputEnergi =
                document.getElementById(
                    'inputEnergi'
                );
            const inputFokus =
                document.getElementById(
                    'inputFokus'
                );
            if (inputStres) {
                inputStres.value =
                    profil.baseline.stres || 3;
            }
            if (inputMood) {
                inputMood.value =
                    profil.baseline.mood || 7;
            }
            if (inputEnergi) {
                inputEnergi.value =
                    profil.baseline.energi || 6;
            }
            if (inputFokus) {
                inputFokus.value =
                    profil.baseline.fokus || 5;
            }
            updatePsikis();
        }
        // ====================
        // RENDER KEBIASAAN
        // ====================
        renderDaftarKebiasaan(profil);
        // ====================
        // LOAD DATA TERAKHIR
        // ====================
        loadLastData();
        // ====================
        // RINGKASAN
        // ====================
        updateRingkasan();
    }
);
// ==================== UPDATE PSIKIS ====================
function updatePsikis() {
    const inputStres =
        document.getElementById('inputStres');
    const inputMood =
        document.getElementById('inputMood');
    const inputEnergi =
        document.getElementById('inputEnergi');
    const inputFokus =
        document.getElementById('inputFokus');
    if (
        !inputStres ||
        !inputMood ||
        !inputEnergi ||
        !inputFokus
    ) {
        return;
    }
    const stres =
        parseInt(inputStres.value) || 1;
    const mood =
        parseInt(inputMood.value) || 1;
    const energi =
        parseInt(inputEnergi.value) || 1;
    const fokus =
        parseInt(inputFokus.value) || 1;
    // Nilai
    document.getElementById(
        'valueStres'
    ).textContent =
        stres + '/10';
    document.getElementById(
        'valueMood'
    ).textContent =
        mood + '/10';
    document.getElementById(
        'valueEnergi'
    ).textContent =
        energi + '/10';
    document.getElementById(
        'valueFokus'
    ).textContent =
        fokus + '/10';
    // Emoji
    document.getElementById(
        'emojiStres'
    ).textContent =
        stres <= 3
            ? '😌'
            : stres <= 6
                ? '😐'
                : '😰';
    document.getElementById(
        'emojiMood'
    ).textContent =
        mood >= 7
            ? '😄'
            : mood >= 4
                ? '🙂'
                : '😞';
    document.getElementById(
        'emojiEnergi'
    ).textContent =
        energi >= 7
            ? '⚡'
            : energi >= 4
                ? '🔋'
                : '🪫';
    document.getElementById(
        'emojiFokus'
    ).textContent =
        fokus >= 7
            ? '🎯'
            : fokus >= 4
                ? '📌'
                : '🌀';
    // Rata-rata
    const rataRata =
        (stres + mood + energi + fokus) / 4;
    const indikator =
        document.getElementById(
            'indikatorPsikis'
        );
    if (!indikator) return;
    if (rataRata >= 7) {
        indikator.className =
            'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-green-50 text-green-700 border border-green-200';
        indikator.textContent =
            '🌟 Kondisi psikis sangat baik! Pertahankan.';
    } else if (rataRata >= 5) {
        indikator.className =
            'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200';
        indikator.textContent =
            '📈 Kondisi cukup, ada ruang untuk perbaikan.';
    } else {
        indikator.className =
            'mt-4 p-3 rounded-lg text-center text-sm font-medium bg-red-50 text-red-700 border border-red-200';
        indikator.textContent =
            '⚠️ Perhatikan keseimbangan psikismu. Istirahat sejenak.';
    }
}
// ==================== RENDER KEBIASAAN ====================
function renderDaftarKebiasaan(profil) {
    const containerBaik =
        document.getElementById(
            'habitsBaikContainer'
        );
    const containerBuruk =
        document.getElementById(
            'habitsBurukContainer'
        );
    if (
        !containerBaik ||
        !containerBuruk
    ) {
        return;
    }
    if (
        profil &&
        profil.kebiasaan
    ) {
        containerBaik.innerHTML =
            profil.kebiasaan.baik
                .map(k => `
                    <label
                        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition"
                    >
                        <input
                            type="checkbox"
                            class="kebiasaan-baik-check accent-green-600"
                            data-nama="${k.nama}"
                            data-poin="${k.poin}"
                            onchange="toggleKebiasaanBaik(this)"
                        />
                        <div class="flex-1">
                            <p class="text-sm text-gray-700">
                                ${k.nama}
                            </p>
                            <p class="text-xs text-green-600 font-semibold">
                                +${k.poin} poin
                            </p>
                        </div>
                    </label>
                `)
                .join('');
        containerBuruk.innerHTML =
            profil.kebiasaan.buruk
                .map(k => `
                    <label
                        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-red-50 transition"
                    >
                        <input
                            type="checkbox"
                            class="kebiasaan-buruk-check accent-red-600"
                            data-nama="${k.nama}"
                            data-poin="${k.poin}"
                            onchange="toggleKebiasaanBuruk(this)"
                        />
                        <div class="flex-1">
                            <p class="text-sm text-gray-700">
                                ${k.nama}
                            </p>
                            <p class="text-xs text-red-600 font-semibold">
                                ${k.poin} poin
                            </p>
                        </div>
                    </label>
                `)
                .join('');
    }
}
// ==================== TOGGLE KEBIASAAN ====================
function toggleKebiasaanBaik(checkbox) {
    const nama =
        checkbox.dataset.nama;
    const poin =
        parseInt(checkbox.dataset.poin);
    if (checkbox.checked) {
        const sudahAda =
            kebiasaanBaikTerpilih
                .some(k => k.nama === nama);
        if (!sudahAda) {
            kebiasaanBaikTerpilih.push({
                nama,
                poin
            });
        }
    } else {
        kebiasaanBaikTerpilih =
            kebiasaanBaikTerpilih.filter(
                k => k.nama !== nama
            );
    }
}
function toggleKebiasaanBuruk(checkbox) {
    const nama =
        checkbox.dataset.nama;
    const poin =
        parseInt(checkbox.dataset.poin);
    if (checkbox.checked) {
        const sudahAda =
            kebiasaanBurukTerpilih
                .some(k => k.nama === nama);
        if (!sudahAda) {
            kebiasaanBurukTerpilih.push({
                nama,
                poin
            });
        }
    } else {
        kebiasaanBurukTerpilih =
            kebiasaanBurukTerpilih.filter(
                k => k.nama !== nama
            );
    }
}
// ==================== PILIH STATUS ====================
function setStatus(btn) {
    document
        .querySelectorAll('.status-btn')
        .forEach(b => {
            b.classList.remove(
                'active-done',
                'active-partial',
                'active-skipped',
                'border-green-500',
                'bg-green-50',
                'border-amber-500',
                'bg-amber-50',
                'border-red-500',
                'bg-red-50'
            );
            b.classList.add(
                'border-2',
                'border-gray-200'
            );
        });
    if (btn.dataset.status === 'done') {
        btn.classList.add(
            'active-done',
            'border-green-500',
            'bg-green-50'
        );
    } else if (
        btn.dataset.status === 'partial'
    ) {
        btn.classList.add(
            'active-partial',
            'border-amber-500',
            'bg-amber-50'
        );
    } else if (
        btn.dataset.status === 'skipped'
    ) {
        btn.classList.add(
            'active-skipped',
            'border-red-500',
            'bg-red-50'
        );
    }
    selectedStatus =
        btn.dataset.status;
}
// ==================== SIMPAN CHECK-IN ====================
function simpanCheckIn() {
    const profil = getProfil();
    if (!profil) return;
    // Ambil waktu tepat saat tombol ditekan
    const sekarang =
        getWaktuSekarang();
    const tanggalSekarang =
        formatTanggal(sekarang);
    const jamSekarang =
        formatJam(sekarang);
    // ====================
    // VALIDASI
    // ====================
    const intentionText =
        document
            .getElementById('intentionText')
            .value
            .trim();
    if (!intentionText) {
        alert(
            'Isi dulu rencanamu hari ini!'
        );
        return;
    }
    if (!selectedStatus) {
        alert(
            'Pilih status pelaksanaan: Selesai, Sebagian, atau Dilewati.'
        );
        return;
    }
    const screenTime =
        parseFloat(
            document.getElementById(
                'screenTime'
            ).value
        ) || 0;
    const jamTidur =
        parseFloat(
            document.getElementById(
                'jamTidur'
            ).value
        ) || 0;
    if (
        screenTime < 0 ||
        screenTime > 24 ||
        jamTidur < 0 ||
        jamTidur > 24
    ) {
        alert(
            'Masukkan angka yang wajar untuk screen time dan tidur.'
        );
        return;
    }
    // ====================
    // PSIKIS
    // ====================
    const stres =
        parseInt(
            document.getElementById(
                'inputStres'
            ).value
        );
    const mood =
        parseInt(
            document.getElementById(
                'inputMood'
            ).value
        );
    const energi =
        parseInt(
            document.getElementById(
                'inputEnergi'
            ).value
        );
    const fokus =
        parseInt(
            document.getElementById(
                'inputFokus'
            ).value
        );
    // ====================
    // POIN KEBIASAAN
    // ====================
    let totalPoinBaik =
        kebiasaanBaikTerpilih
            .reduce(
                (sum, k) =>
                    sum + k.poin,
                0
            );
    let totalPoinBuruk =
        kebiasaanBurukTerpilih
            .reduce(
                (sum, k) =>
                    sum + k.poin,
                0
            );
    const detailBaikTambahan = [];
    const detailBurukTambahan = [];
    // ====================
    // SCREEN TIME
    // ====================
    let poinScreen = 0;
    if (screenTime > 10) {
        poinScreen = -5;
        detailBurukTambahan.push(
            `Screen time ${screenTime} jam (>10 jam)`
        );
    } else if (screenTime > 8) {
        poinScreen = -3;
        detailBurukTambahan.push(
            `Screen time ${screenTime} jam (>8 jam)`
        );
    } else if (
        screenTime > 0 &&
        screenTime < 4
    ) {
        poinScreen = 5;
        detailBaikTambahan.push(
            `Screen time ${screenTime} jam (<4 jam)`
        );
    }
    // ====================
    // TIDUR
    // ====================
    let poinTidur = 0;
    if (
        jamTidur < 6 &&
        jamTidur > 0
    ) {
        poinTidur = -4;
        detailBurukTambahan.push(
            `Tidur ${jamTidur} jam (<6 jam)`
        );
    } else if (
        jamTidur >= 7 &&
        jamTidur <= 9
    ) {
        poinTidur = 3;
        detailBaikTambahan.push(
            `Tidur ${jamTidur} jam (ideal)`
        );
    }
    // Tambahkan poin
    if (poinScreen > 0) {
        totalPoinBaik += poinScreen;
    } else {
        totalPoinBuruk += poinScreen;
    }
    if (poinTidur > 0) {
        totalPoinBaik += poinTidur;
    } else {
        totalPoinBuruk += poinTidur;
    }
    // ====================
    // POIN STATUS
    // ====================
    let poinStatus = 0;
    if (
        selectedStatus === 'done'
    ) {
        poinStatus = 10;
    } else if (
        selectedStatus === 'partial'
    ) {
        poinStatus = 5;
    } else {
        poinStatus = -5;
    }
    // ====================
    // POIN PSIKIS
    // ====================
    const avgPsikis =
        (
            stres +
            mood +
            energi +
            fokus
        ) / 4;
    let poinPsikis = 0;
    if (avgPsikis >= 7) {
        poinPsikis = 5;
    } else if (avgPsikis <= 3) {
        poinPsikis = -3;
    }
    // ====================
    // TOTAL POIN
    // ====================
    const poinHarian =
        totalPoinBaik +
        totalPoinBuruk +
        poinStatus +
        poinPsikis;
    // ====================
    // DETAIL KEBIASAAN
    // ====================
    const detailBaik =
        kebiasaanBaikTerpilih
            .map(k => k.nama)
            .concat(detailBaikTambahan)
            .join(', ');
    const detailBuruk =
        kebiasaanBurukTerpilih
            .map(k => k.nama)
            .concat(detailBurukTambahan)
            .join(', ');
    // ====================
    // RIWAYAT
    // ====================
    const riwayat =
        getRiwayat();
    // ====================
    // ESTIMASI TARGET
    // ====================
    let estimasiTanggal =
        profil.targetDate;
    if (riwayat.length > 0) {
        estimasiTanggal =
            riwayat[
                riwayat.length - 1
            ].estimasi_tanggal;
    }
    let penaltiHari = 0;
    if (
        selectedStatus === 'skipped'
    ) {
        penaltiHari =
            PENALTI_SKIPPED;
        estimasiTanggal =
            tambahHari(
                estimasiTanggal,
                PENALTI_SKIPPED
            );
    } else if (
        selectedStatus === 'partial'
    ) {
        penaltiHari =
            PENALTI_PARTIAL;
        estimasiTanggal =
            tambahHari(
                estimasiTanggal,
                PENALTI_PARTIAL
            );
    }
    // ====================
    // RISK SCORE
    // ====================
    let riskScore = 0;
    if (
        selectedStatus === 'skipped'
    ) {
        riskScore += 40;
    } else if (
        selectedStatus === 'partial'
    ) {
        riskScore += 20;
    }
    riskScore +=
        Math.max(
            0,
            (stres - 5) * 3
        );
    riskScore +=
        Math.max(
            0,
            (5 - mood) * 2
        );
    riskScore +=
        Math.max(
            0,
            (5 - energi) * 2
        );
    riskScore +=
        Math.max(
            0,
            (5 - fokus) * 2
        );
    riskScore +=
        Math.abs(
            totalPoinBuruk
        ) * 0.5;
    if (screenTime > 8) {
        riskScore += 10;
    }
    if (
        jamTidur < 6 &&
        jamTidur > 0
    ) {
        riskScore += 15;
    }
    riskScore =
        Math.min(
            100,
            Math.round(riskScore)
        );
    // ====================
    // DATA CHECK-IN
    // ====================
    const dataCheckIn = {
        // Waktu aktual saat tombol ditekan
        tanggal: tanggalSekarang,
        jam_checkin: jamSekarang,
        // Hari ke berapa sejak onboarding
        hari_ke:
            hitungHariKe(
                profil.tanggalOnboarding ||
                tanggalSekarang,
                sekarang
            ),
        // 0 = Minggu
        // 1 = Senin
        // 2 = Selasa
        // dst.
        hari_dalam_minggu:
            sekarang.getDay(),
        jumlah_intention: 1,
        intention_text:
            intentionText,
        jam_direncanakan:
            profil.jamProduktif || 4,
        jam_aktual:
            selectedStatus === 'done'
                ? (profil.jamProduktif || 4)
                : selectedStatus === 'partial'
                    ? (profil.jamProduktif || 4) * 0.5
                    : 0,
        status_checkin:
            selectedStatus,
        persentase_penyelesaian:
            selectedStatus === 'done'
                ? 1.0
                : selectedStatus === 'partial'
                    ? 0.5
                    : 0.0,
        screen_time:
            screenTime,
        jam_tidur:
            jamTidur,
        stres_level:
            stres,
        mood_level:
            mood,
        energi_level:
            energi,
        fokus_level:
            fokus,
        jumlah_kebiasaan_baik:
            kebiasaanBaikTerpilih.length +
            detailBaikTambahan.length,
        poin_kebiasaan_baik:
            totalPoinBaik,
        jumlah_kebiasaan_buruk:
            kebiasaanBurukTerpilih.length +
            detailBurukTambahan.length,
        poin_kebiasaan_buruk:
            totalPoinBuruk,
        detail_kebiasaan_buruk:
            detailBuruk,
        detail_kebiasaan_baik:
            detailBaik,
        ada_gangguan:
            false,
        jenis_gangguan:
            '',
        progress_goal:
            hitungProgressGoal(
                riwayat,
                sekarang
            ),
        risk_score_rule:
            riskScore,
        estimasi_mundur_hari:
            penaltiHari,
        poin_harian:
            poinHarian,
        poin_total:
            riwayat.reduce(
                (sum, r) =>
                    sum + (r.poin_harian || 0),
                0
            ) + poinHarian,
        refleksi:
            document
                .getElementById(
                    'refleksiText'
                )
                .value
                .trim(),
        estimasi_tanggal:
            estimasiTanggal,
        apakah_berhasil:
            selectedStatus === 'done'
                ? true
                : false
    };
    // ====================
    // SIMPAN
    // ====================
    riwayat.push(
        dataCheckIn
    );
    saveRiwayat(
        riwayat
    );
    // ====================
    // DAMPAK
    // ====================
    const dampakSection =
        document.getElementById(
            'dampakSection'
        );
    if (
        selectedStatus !== 'done'
    ) {
        dampakSection
            .classList
            .remove('hidden');
        document.getElementById(
            'dampakHari'
        ).textContent =
            '+' + penaltiHari + ' hari';
        document.getElementById(
            'dampakPoin'
        ).textContent =
            (
                totalPoinBuruk < 0
                    ? totalPoinBuruk
                    : 0
            ) + ' poin';
        document.getElementById(
            'dampakText'
        ).textContent =
            selectedStatus === 'skipped'
                ? 'Kamu melewatkan rencana hari ini. Estimasi pencapaian target mundur ' +
                    penaltiHari +
                    ' hari.'
                : 'Kamu hanya menyelesaikan sebagian rencana. Estimasi mundur ' +
                    penaltiHari +
                    ' hari.';
    } else {
        dampakSection
            .classList
            .add('hidden');
    }
    // ====================
    // UPDATE UI
    // ====================
    const estimasiDisplay =
        document.getElementById(
            'estimasiDisplay'
        );
    if (estimasiDisplay) {
        estimasiDisplay.textContent =
            estimasiTanggal;
    }
    document.getElementById(
        'poinTotal'
    ).textContent =
        dataCheckIn.poin_total;
    updateRingkasan();
    tampilkanAICoach(
        dataCheckIn
    );
    tampilkanPeringatan(
        screenTime,
        jamTidur
    );
    // ====================
    // RESET FORM
    // ====================
    document.getElementById(
        'intentionText'
    ).value = '';
    document.getElementById(
        'refleksiText'
    ).value = '';
    document.getElementById(
        'screenTime'
    ).value = '';
    document.getElementById(
        'jamTidur'
    ).value = '';
    document
        .querySelectorAll(
            '.status-btn'
        )
        .forEach(b => {
            b.classList.remove(
                'active-done',
                'active-partial',
                'active-skipped',
                'border-green-500',
                'bg-green-50',
                'border-amber-500',
                'bg-amber-50',
                'border-red-500',
                'bg-red-50'
            );
            b.classList.add(
                'border-2',
                'border-gray-200'
            );
        });
    selectedStatus = null;
    kebiasaanBaikTerpilih = [];
    kebiasaanBurukTerpilih = [];
    document
        .querySelectorAll(
            '.kebiasaan-baik-check, .kebiasaan-buruk-check'
        )
        .forEach(
            cb => cb.checked = false
        );
    alert(
        `✅ Check-in berhasil disimpan!\n\nTanggal: ${tanggalSekarang}\nJam: ${jamSekarang}`
    );
    // Reload agar data terbaru langsung tampil
    location.reload();
}
// ==================== PROGRESS GOAL ====================
function hitungProgressGoal(
    riwayat,
    tanggalSekarang = getWaktuSekarang()
) {
    const profil =
        getProfil();
    if (
        !profil ||
        !profil.targetDate
    ) {
        return 0;
    }
    const tanggalMulai =
        profil.tanggalOnboarding ||
        formatTanggal(
            tanggalSekarang
        );
    const [tahunMulai, bulanMulai, hariMulai] =
        tanggalMulai
            .split('-')
            .map(Number);
    const [tahunTarget, bulanTarget, hariTarget] =
        profil.targetDate
            .split('-')
            .map(Number);
    const mulai =
        new Date(
            tahunMulai,
            bulanMulai - 1,
            hariMulai
        );
    const target =
        new Date(
            tahunTarget,
            bulanTarget - 1,
            hariTarget
        );
    const sekarang =
        new Date(
            tanggalSekarang.getFullYear(),
            tanggalSekarang.getMonth(),
            tanggalSekarang.getDate()
        );
    const totalHari =
        Math.max(
            1,
            (
                target - mulai
            ) /
            (1000 * 60 * 60 * 24)
        );
    const hariBerjalan =
        Math.max(
            0,
            (
                sekarang - mulai
            ) /
            (1000 * 60 * 60 * 24)
        );
    return Math.min(
        1,
        hariBerjalan / totalHari
    );
}
// ==================== UPDATE POIN TOTAL ====================
function updatePoinTotal() {
    const riwayat =
        getRiwayat();
    const total =
        riwayat.reduce(
            (sum, item) =>
                sum +
                (item.poin_harian || 0),
            0
        );
    const poinTotal =
        document.getElementById(
            'poinTotal'
        );
    if (poinTotal) {
        poinTotal.textContent =
            total;
    }
}
// ==================== UPDATE RINGKASAN ====================
function updateRingkasan() {
    const riwayat =
        getRiwayat();
    if (
        riwayat.length === 0
    ) {
        document.getElementById(
            'avgStress'
        ).textContent = '-';
        document.getElementById(
            'avgMood'
        ).textContent = '-';
        document.getElementById(
            'avgEnergi'
        ).textContent = '-';
        document.getElementById(
            'avgFokus'
        ).textContent = '-';
        return;
    }
    const latest =
        riwayat[
            riwayat.length - 1
        ];
    document.getElementById(
        'avgStress'
    ).textContent =
        latest.stres_level ?? '-';
    document.getElementById(
        'avgMood'
    ).textContent =
        latest.mood_level ?? '-';
    document.getElementById(
        'avgEnergi'
    ).textContent =
        latest.energi_level ?? '-';
    document.getElementById(
        'avgFokus'
    ).textContent =
        latest.fokus_level ?? '-';
}
// ==================== PERINGATAN ====================
function tampilkanPeringatan(
    screenTime,
    jamTidur
) {
    const container =
        document.getElementById(
            'warningContainer'
        );
    const text =
        document.getElementById(
            'warningText'
        );
    if (
        !container ||
        !text
    ) {
        return;
    }
    const warnings = [];
    if (screenTime > 8) {
        warnings.push(
            `Screen time ${screenTime} jam – kurangi!`
        );
    }
    if (
        jamTidur < 6 &&
        jamTidur > 0
    ) {
        warnings.push(
            `Tidur ${jamTidur} jam – kurang!`
        );
    }
    if (
        warnings.length > 0
    ) {
        container
            .classList
            .remove('hidden');
        text.textContent =
            warnings.join(' ');
    } else {
        container
            .classList
            .add('hidden');
    }
}
// ==================== AI COACH ====================
function tampilkanAICoach(data) {
    const box =
        document.getElementById(
            'aiChatBox'
        );
    if (!box) return;
    let saran = '';
    if (
        data.stres_level > 7
    ) {
        saran +=
            '⚠️ Stres tinggi, coba teknik pernapasan. ';
    }
    if (
        data.mood_level < 4
    ) {
        saran +=
            '😔 Mood rendah, lakukan aktivitas menyenangkan. ';
    }
    if (
        data.energi_level < 4
    ) {
        saran +=
            '🪫 Energi rendah, pastikan tidur & makan. ';
    }
    if (
        data.fokus_level < 4
    ) {
        saran +=
            '🌀 Fokus rendah, gunakan Pomodoro. ';
    }
    if (
        data.screen_time > 8
    ) {
        saran +=
            `📱 Screen time ${data.screen_time} jam, kurangi untuk produktivitas. `;
    }
    if (
        data.jam_tidur < 6 &&
        data.jam_tidur > 0
    ) {
        saran +=
            `😴 Tidur ${data.jam_tidur} jam, usahakan 7-8 jam. `;
    }
    if (
        data.status_checkin === 'done'
    ) {
        saran +=
            '✅ Bagus! Rencana selesai. ';
    } else if (
        data.status_checkin === 'partial'
    ) {
        saran +=
            '◐ Sebagian selesai, identifikasi hambatan. ';
    } else {
        saran +=
            '❌ Hari terlewat, besok mulai lagi. ';
    }
    if (
        data.detail_kebiasaan_baik
    ) {
        saran +=
            `Baik: ${data.detail_kebiasaan_baik}. `;
    }
    if (
        data.detail_kebiasaan_buruk
    ) {
        saran +=
            `Buruk: ${data.detail_kebiasaan_buruk}. `;
    }
    box.innerHTML =
        `<p class="text-gray-700">${saran}</p>`;
}
// ==================== LOAD DATA TERAKHIR ====================
function loadLastData() {
    const riwayat =
        getRiwayat();
    if (
        riwayat.length === 0
    ) {
        return;
    }
    const last =
        riwayat[
            riwayat.length - 1
        ];
    // ====================
    // FORM
    // ====================
    const intention =
        document.getElementById(
            'intentionText'
        );
    const refleksi =
        document.getElementById(
            'refleksiText'
        );
    const screenTime =
        document.getElementById(
            'screenTime'
        );
    const jamTidur =
        document.getElementById(
            'jamTidur'
        );
    if (intention) {
        intention.value =
            last.intention_text || '';
    }
    if (refleksi) {
        refleksi.value =
            last.refleksi || '';
    }
    if (screenTime) {
        screenTime.value =
            last.screen_time ?? '';
    }
    if (jamTidur) {
        jamTidur.value =
            last.jam_tidur ?? '';
    }
    // ====================
    // STATUS
    // ====================
    if (
        last.status_checkin
    ) {
        const btn =
            document.querySelector(
                `.status-btn[data-status="${last.status_checkin}"]`
            );
        if (btn) {
            setStatus(btn);
        }
    }
    // ====================
    // PSIKIS
    // ====================
    if (
        last.stres_level !== undefined
    ) {
        document.getElementById(
            'inputStres'
        ).value =
            last.stres_level;
        document.getElementById(
            'inputMood'
        ).value =
            last.mood_level;
        document.getElementById(
            'inputEnergi'
        ).value =
            last.energi_level;
        document.getElementById(
            'inputFokus'
        ).value =
            last.fokus_level;
        updatePsikis();
    }
    // ====================
    // KEBIASAAN BAIK
    // ====================
    if (
        last.detail_kebiasaan_baik
    ) {
        const arr =
            last.detail_kebiasaan_baik
                .split(', ');
        document
            .querySelectorAll(
                '#habitsBaikContainer input[type="checkbox"]'
            )
            .forEach(cb => {
                const nama =
                    cb.dataset.nama;
                if (
                    arr.includes(nama)
                ) {
                    cb.checked = true;
                    kebiasaanBaikTerpilih.push({
                        nama,
                        poin:
                            parseInt(
                                cb.dataset.poin
                            )
                    });
                }
            });
    }
    // ====================
    // KEBIASAAN BURUK
    // ====================
    if (
        last.detail_kebiasaan_buruk
    ) {
        const arr =
            last.detail_kebiasaan_buruk
                .split(', ');
        document
            .querySelectorAll(
                '#habitsBurukContainer input[type="checkbox"]'
            )
            .forEach(cb => {
                const nama =
                    cb.dataset.nama;
                if (
                    arr.includes(nama)
                ) {
                    cb.checked = true;
                    kebiasaanBurukTerpilih.push({
                        nama,
                        poin:
                            parseInt(
                                cb.dataset.poin
                            )
                    });
                }
            });
    }
    // ====================
    // AI
    // ====================
    tampilkanAICoach(last);
    // ====================
    // WARNING
    // ====================
    tampilkanPeringatan(
        last.screen_time || 0,
        last.jam_tidur || 0
    );
    // ====================
    // DAMPAK
    // ====================
    if (
        last.status_checkin !== 'done'
    ) {
        const dampakSection =
            document.getElementById(
                'dampakSection'
            );
        if (dampakSection) {
            dampakSection
                .classList
                .remove('hidden');
            document.getElementById(
                'dampakHari'
            ).textContent =
                `+${last.estimasi_mundur_hari || 0} hari`;
            document.getElementById(
                'dampakPoin'
            ).textContent =
                `${last.poin_kebiasaan_buruk || 0} poin`;
            document.getElementById(
                'dampakText'
            ).textContent =
                last.status_checkin === 'skipped'
                    ? 'Kamu melewatkan rencana hari ini.'
                    : 'Kamu hanya menyelesaikan sebagian rencana.';
        }
    }
}
// ==================== CHAT ====================
function kirimChat() {
    const input =
        document.getElementById(
            'chatInput'
        );
    if (!input) return;
    const pesan =
        input.value.trim();
    if (!pesan) return;
    const box =
        document.getElementById(
            'aiChatBox'
        );
    box.innerHTML +=
        `<p class="mt-2"><strong>Kamu:</strong> ${pesan}</p>`;
    input.value = '';
    setTimeout(() => {
        box.innerHTML +=
            `<p class="mt-2"><strong>AI Coach:</strong> Terima kasih atas pertanyaanmu. Saya sarankan fokus pada satu kebiasaan kecil untuk diperbaiki. Tetap semangat!</p>`;
        box.scrollTop =
            box.scrollHeight;
    }, 500);
}
// ==================== RESET ====================
function resetData() {
    if (
        confirm(
            'Yakin ingin menghapus semua data check-in dan profil?'
        )
    ) {
        localStorage.removeItem(
            STORAGE_KEY_PROFIL
        );
        localStorage.removeItem(
            STORAGE_KEY_RIWAYAT
        );
        location.reload();
    }
}
