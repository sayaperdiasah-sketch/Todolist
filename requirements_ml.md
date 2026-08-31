# Kebutuhan Machine Learning untuk "Jejak Menuju Target"

## 1. Tujuan
Menggantikan aturan rule-based sederhana dengan model ML yang dapat:
- **Memprediksi risk score** (nilai 0–100) secara personal.
- **Mengklasifikasikan apakah hari check-in berhasil** (berdasarkan persentase penyelesaian ≥ 70%).
- **Memproyeksikan estimasi tanggal pencapaian** target berdasarkan pola historis.
- **Memberikan rekomendasi tindakan** berdasarkan kondisi psikis dan kebiasaan.

## 2. Sumber Data
Data dikumpulkan otomatis oleh frontend (JavaScript) dan disimpan di `localStorage`, kemudian diekspor sebagai CSV/JSON oleh user.

**Lokasi penyimpanan sementara:** `localStorage` dengan key `riwayatCheckIn`.

**Struktur data per hari (1 baris):**
| Kolom | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `tanggal` | date | Tanggal check-in (YYYY-MM-DD) | 2026-08-31 |
| `hari_ke` | int | Hari ke berapa sejak mulai | 15 |
| `hari_dalam_minggu` | int | 0=Senin, 6=Minggu | 0 |
| `jam_checkin` | string | Jam check-in (HH:MM) | 22:30 |
| `jumlah_intention` | int | Banyaknya rencana hari itu | 3 |
| `jam_direncanakan` | float | Total jam rencana | 4.0 |
| `jam_aktual` | float | Total jam benar dikerjakan | 2.5 |
| `status_checkin` | enum | `done`, `partial`, `skipped` | partial |
| `persentase_penyelesaian` | float | 0.0–1.0 | 0.6 |
| `stres_level` | int | Skala 1–10 | 4 |
| `mood_level` | int | Skala 1–10 | 7 |
| `energi_level` | int | Skala 1–10 | 6 |
| `fokus_level` | int | Skala 1–10 | 5 |
| `motivasi_level` | int | Skala 1–10 (opsional) | 8 |
| `jumlah_kebiasaan_baik` | int | Jumlah kebiasaan baik dilakukan | 2 |
| `poin_kebiasaan_baik` | int | Total poin positif | 15 |
| `jumlah_kebiasaan_buruk` | int | Jumlah kebiasaan buruk | 1 |
| `poin_kebiasaan_buruk` | int | Total poin negatif | -8 |
| `detail_kebiasaan_buruk` | text | Deskripsi bebas | "Scroll sosmed 2 jam" |
| `ada_gangguan` | bool | Apakah ada kejadian tak terduga | true |
| `jenis_gangguan` | text | Keterangan gangguan | "Lembur mendadak" |
| `progress_goal` | float | Persentase capaian target keseluruhan (0–1) | 0.35 |
| `risk_score_rule` | float | Risk score dari aturan manual (untuk baseline) | 45.0 |
| `estimasi_mundur_hari` | int | Penalti hari dari aturan manual | 2 |
| `poin_total` | int | Akumulasi poin user | 120 |
| `refleksi` | text | Catatan reflektif harian | "Hari ini cukup baik" |
| `apakah_berhasil` | bool | Label: 1 jika persentase ≥ 0.7, else 0 | true |

## 3. Pra-pemrosesan
- Tangani missing value (misal `motivasi_level` jika tidak diisi → isi median).
- Encode kategorikal: `status_checkin` → one-hot atau ordinal.
- Normalisasi fitur numerik (MinMaxScaler atau StandardScaler).
- Untuk teks (`refleksi`, `detail_kebiasaan_buruk`): gunakan TF-IDF atau embedding sederhana.

## 4. Model yang Disarankan
### A. Klasifikasi `apakah_berhasil`
- **Model awal:** Random Forest Classifier atau XGBoost.
- **Alasan:** Dataset kecil (30–100 baris), robust terhadap outlier, mudah interpretasi.
- **Evaluasi:** Accuracy, precision, recall, F1. Gunakan cross-validation (k=5) karena data terbatas.

### B. Regresi `risk_score` (prediksi risk score personal)
- **Model awal:** Random Forest Regressor atau Gradient Boosting.
- **Target:** `risk_score` yang akan digunakan untuk mengganti aturan manual.
- **Fitur:** Semua kolom numerik + hasil encoding.
- **Evaluasi:** MAE, RMSE, R².

### C. Time Series Forecasting `estimasi_tanggal`
- Jika data cukup (≥ 60 hari), gunakan model time series seperti:
  - **Prophet** (Facebook) untuk proyeksi tanggal berdasarkan tren produktivitas.
  - **ARIMA/SARIMA** untuk pola mingguan.
- **Output:** Perkiraan tanggal pencapaian target.

### D. Analisis Sentimen / Rekomendasi
- Untuk teks refleksi, gunakan model bahasa (misal IndoBERT atau LLM API) untuk menilai sentimen dan menghasilkan rekomendasi personal.

## 5. Alur Training di Google Colab
1. **Upload CSV** hasil export dari aplikasi.
2. **Load data** dengan pandas.
3. **Pra-pemrosesan** sesuai di atas.
4. **Split data** (train/test atau time-based split).
5. **Training** model pilihan.
6. **Evaluasi** performa.
7. **Simpan model** (pickle/joblib) untuk diintegrasikan ke backend.
8. **Laporan** berisi metrik dan feature importance.

## 6. Contoh Kode Awal (Colab)
```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Load
df = pd.read_csv('data_checkin.csv')

# Pilih fitur & label
features = ['stres_level','mood_level','energi_level','fokus_level',
            'poin_kebiasaan_baik','poin_kebiasaan_buruk',
            'jam_direncanakan','jam_aktual','persentase_penyelesaian']
X = df[features]
y = df['apakah_berhasil']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluasi
y_pred = model.predict(X_test)
print(accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))
```

## 7. Kebutuhan Selanjutnya
- **Minimal data:** 30 hari untuk klasifikasi sederhana, 60+ hari untuk time series.
- **Integrasi:** Backend (FastAPI/Flask) akan memuat model dan melakukan prediksi real-time.
- **Pembaruan model:** Latih ulang secara berkala (misal tiap bulan) dengan data baru.

*Dokumen ini akan terus berkembang seiring kebutuhan.*
