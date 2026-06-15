# Dokumentasi API EnchantDoll - Toram Online Grimoire

Dokumentasi ini menjelaskan secara mendetail endpoint API, seluruh struktur payload request-response, beserta daftar lengkap `baseId` stat yang valid digunakan untuk kalkulasi.

---

## Spesifikasi API

* **Endpoint**: `POST http://localhost:9040/calculate`
* **Content-Type**: `application/json`

---

## 1. Request Payload (JSON)

Berikut adalah contoh payload permintaan yang lengkap:

```json
{
  "equipmentType": 0,
  "originalPotential": 90,
  "autoFindPotentialMinimum": false,
  "positiveStats": [
    { "baseId": "atk", "type": "multiplier", "value": 10 },
    { "baseId": "critical_damage", "type": "constant", "value": 20 },
    { "baseId": "critical_damage", "type": "multiplier", "value": 10 }
  ],
  "negativeStats": [],
  "autoFindNegative": true,
  "baseType": "none",
  "autoFindType": "success-rate"
}
```

### Penjelasan Field Payload Request:

| Nama Field | Tipe Data | Pilihan Nilai / Format | Deskripsi |
| :--- | :--- | :--- | :--- |
| `equipmentType` | `number` | `0`, `1`, `2` | Jenis perlengkapan:<br>• `0`: Main Weapon (Senjata Utama)<br>• `1`: Body Armor (Zirah)<br>• `2`: Main Weapon - Original Element (Senjata dengan Elemen Asli) |
| `originalPotential` | `number` | Integer (e.g. `90`) | Kapasitas potential awal bawaan perlengkapan sebelum di-enchant. |
| `autoFindPotentialMinimum` | `boolean` | `true` / `false` | Jika `true`, engine akan mencari batas potential terkecil secara otomatis. |
| `positiveStats` | `array` | List of Stat Object | Daftar stat positif yang ingin ditambahkan ke perlengkapan. (Maksimal 8 slot total bersama stat negatif). |
| `negativeStats` | `array` | List of Stat Object | Daftar stat negatif yang ditambahkan secara manual (hanya digunakan jika `autoFindNegative` bernilai `false`). |
| `autoFindNegative` | `boolean` | `true` / `false` | Jika `true`, engine otomatis mencari dan menyusun kombinasi stat negatif terbaik untuk mengembalikan potential terbanyak. |
| `baseType` | `string` | `"physical"`, `"magic"`, `"none"` | Tipe serangan dasar karakter. Menentukan prioritas stat negatif otomatis (hanya berlaku jika `equipmentType` bernilai `1` / Body Armor). |
| `autoFindType` | `string` | `"success-rate"`, `"material"` | Kriteria pencarian otomatis stat negatif:<br>• `"success-rate"`: Memaksimalkan peluang sukses.<br>• `"material"`: Meminimalkan biaya material poin. |

---

### Struktur Stat Object (Di dalam `positiveStats` & `negativeStats`)

Setiap objek stat di dalam array memiliki format berikut:

```json
{
  "baseId": "atk",
  "type": "multiplier",
  "value": 10
}
```

* **`baseId`** (`string`): ID dasar stat (lihat daftar lengkap di bawah).
* **`type`** (`string` / `number`): Tipe nilai stat.
  * `"constant"` atau `0`: Nilai stat konstan (angka riil, e.g. `+20`).
  * `"multiplier"` atau `1`: Nilai stat berupa persentase (e.g. `+10%`).
* **`value`** (`number`): Nilai target stat (positif atau negatif). Jika dikosongkan pada stat positif, otomatis diisi batas maksimal.

---

## 2. Response Payload (JSON)

Format kembalian respons setelah kalkulasi sukses:

```json
{
  "success": true,
  "originalPotential": 90,
  "realSuccessRate": 287.5693311582382,
  "steps": [
    {
      "type": "normal",
      "stepPotential": 90,
      "remainingPotential": 10,
      "text": "#|Critical Damage+8%|10pt"
    },
    {
      "type": "each",
      "stepPotential": 10,
      "remainingPotential": 1,
      "text": "@|Critical Damage+3|1pt"
    }
  ]
}
```

* **`success`** (`boolean`): Menunjukkan keberhasilan kalkulasi.
* **`originalPotential`** (`number`): Potential awal yang digunakan.
* **`realSuccessRate`** (`number`): Tingkat persentase kesuksesan enchant (jika di atas 100%, peluang sukses 100% mutlak).
* **`steps`** (`array`): Daftar urutan langkah enchant yang harus dilakukan secara berurutan.
  * `type`: Jenis pengisian (`"normal"` sekaligus, atau `"each"` satu-per-satu).
  * `text`: Instruksi teks terjemahan langkah enchant.

---

## 3. Daftar Lengkap `baseId` Stat Valid

Berikut adalah daftar string `baseId` yang valid dikirimkan ke server API:

### A. Atribut Dasar (Stats)
* `str` - STR (Strength)
* `dex` - DEX (Dexterity)
* `int` - INT (Intelligence)
* `agi` - AGI (Agility)
* `vit` - VIT (Vitality)

### B. HP & MP
* `max_hp` - MaxHP
* `max_mp` - MaxMP
* `natural_hp_regen` - Natural HP Regen
* `natural_mp_regen` - Natural MP Regen
* `attack_mp_recovery` - Attack MP Recovery

### C. Serangan & Penetrasi (Attack & Pierce)
* `atk` - ATK
* `matk` - MATK
* `weapon_atk` - Weapon ATK
* `physical_pierce` - Physical Pierce
* `magic_pierce` - Magic Pierce
* `stability` - Stability
* `unsheathe_attack` - Unsheathe Attack
* `unsheathe_attack_multiplier` - Unsheathe Attack %
* `short_range_damage` - Short Range Damage
* `long_range_damage` - Long Range Damage

### D. Pertahanan & Resitansi (Defense & Resistance)
* `def` - DEF
* `mdef` - MDEF
* `physical_resistance` - Physical Resistance
* `magic_resistance` - Magic Resistance
* `ailment_resistance` - Ailment Resistance
* `guard_rate` - Guard Rate
* `guard_power` - Guard Power
* `neutral_resistance` - Neutral Resistance
* `fire_resistance` - Fire Resistance
* `water_resistance` - Water Resistance
* `earth_resistance` - Earth Resistance
* `wind_resistance` - Wind Resistance
* `light_resistance` - Light Resistance
* `dark_resistance` - Dark Resistance

### E. Kecepatan & Akurasi (Speed & Accuracy)
* `aspd` - ASPD (Attack Speed)
* `cspd` - CSPD (Cast Speed)
* `accuracy` - Accuracy
* `dodge` - Dodge
* `motion_speed` - Motion Speed
* `movement_speed` - Movement Speed

### F. Kritis (Critical)
* `critical_rate` - Critical Rate
* `critical_damage` - Critical Damage

### G. Elemen Senjata (Weapon Element)
* `element_fire` - Element Fire
* `element_water` - Element Water
* `element_earth` - Element Earth
* `element_wind` - Element Wind
* `element_light` - Element Light
* `element_dark` - Element Dark

### H. Efek Tambahan Musuh (Stronger Against Element)
* `stronger_against_neutral` - Stronger Against Neutral
* `stronger_against_fire` - Stronger Against Fire
* `stronger_against_water` - Stronger Against Water
* `stronger_against_earth` - Stronger Against Earth
* `stronger_against_wind` - Stronger Against Wind
* `stronger_against_light` - Stronger Against Light
* `stronger_against_dark` - Stronger Against Dark

### I. Lain-lain
* `aggro` - Aggro (Kecenderungan diserang monster)
* `drop_rate` - Drop Rate (Peluang dapat item)
* `exp_rate` - EXP Rate
* `reflect` - Reflect (Memantulkan serangan)
* `physical_barrier` - Physical Barrier
* `magical_barrier` - Magical Barrier
* `fractional_barrier` - Fractional Barrier
* `item_cooldown` - Item Cooldown
* `absolute_dodge` - Absolute Dodge
* `absolute_accuracy` - Absolute Accuracy
