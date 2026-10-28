# Apiarium 3D: Cam Gözlem Kovanı & Bal Arısı Koloni Simülatörü
**(3D Glass Apiarium & Honey Bee Colony Environmental Simulator)**

Müze kalitesinde, Three.js (r160+ PBR pipeline), React 19, TypeScript ve Web Audio API ile geliştirilmiş interaktif 3D cam gözlem kovanı simülatörü.

---

## 🌟 Öne Çıkan Özellikler

### 1. Koloni Dinamikleri & Kast Sistemi
- **Ana Arı (Queen Mother):** Kovanın merkezindeki kuluçka peteğinde (brood nest) yumurtlar; çevresinde ona bakan refakatçi işçi arılar (*queen retinue*) yer alır.
- **Tarlacı İşçi Arılar (Field Foragers):** Üst kattaki çiçek bahçesi (ayçiçeği, lavanta, yonca ve nektar çanağı) ile petek arasında uçar. Dönüşte nektar ve polen koordinatlarını bildiren **Sekiz Figürü Sallantı Dansı**nı (*Waggle Dance*) icra eder. Arka bacaklarındaki polen sepetçikleri (*corbiculae*) doludur.
- **Petek Mimarları (Wax Comb Builders):** Çerçeve kenarlarında **zincirleme** (*festooning*) dizilerek balmumu salgılar ve altıgen hücreler inşa eder.
- **Bakıcı Arılar (Brood Nurses):** Açık petek gözlerindeki hilal biçimli beyaz larvaları arı sütü ve fermente polenle (arı ekmeği) besler, pupa gözlerini sırla kapatır.
- **Giriş Muhafızları (Hive Guards):** Uçuş tahtası ve giriş ağzında devriye gezerek tehditleri tarar.
- **Havalandırmacı Arılar (Thermoregulation Fanners):** Sıcaklık >34°C olduğunda kovanı soğutmak ve nektarı bala dönüştürmek için **≈230–250 Hz** frekansında kanat çırparak hava akımı sağlar.
- **Erkek Arılar (Drones):** İri gövdeli, tepe birleşik gözlü erkek arılar.

### 2. Koloni Nüfus & Bal Ekonomisi
- Mantıksal nüfus (~10.000) ile görsel arı LOD (30–60 arı) ayrımı.
- Nektar buharlaşması (havalandırmacı katkısıyla olgun bala dönüşüm).
- Nem <%30 olduğunda **Bal Kristalizasyon Uyarısı** ve artan tüketim.
- Sıcaklık >36°C olduğunda (5 dk) **Kuluçka Stresi** ve larva kaybı.
- Bal rezervi < 0.8 kg kış eşiği altına indiğinde kış salkımı ve koloni küçülmesi.

### 3. Tehdit Simülasyonu & Kovan Savunması
- **Avcı Tehdidi (*Vespa velutina*, *Vespa mandarinia*, *Vespula* spp.):**
  - Muhafız alarm vızıltısı yayar ve avcıya hücum eder.
  - ***Apis cerana* & *Vespa mandarinia* Eşleşmesi:** Eşsiz senkronize **termal savunma topu** (*thermal bee-ball*) oluşturarak avcıyı 46°C fırınlama ısısıyla etkisiz hale getirir.
  - *Vespa velutina*'ya karşı ısırma ve düşürme savunması uygulanır.
  - 3 dakika içinde püskürtülmezse muhafız kaybı uyarısı verilir.
- **Duman Körüğü (Bee Smoker - `S`, 8 sn cooldown):** Beyaz çam dumanı üfler; alarm feromonlarını maskeleyerek koloniyi sakinleştirir.
- **Cama Vurma Etkisi (Glass Tap - `T`, 4 sn cooldown):** Cam üzerinde fiziksel şok dalgası halkaları ve akustik rezonans oluşturur; yakınındaki arıları teyakkuza geçirir.

### 4. Arı Alt Türü Özelleştirici & Genetik Mühendisliği
- **5 Hazır Alt Tür:**
  1. *Apis mellifera ligustica* (İtalyan Arısı)
  2. *Apis mellifera carnica* (Karniyol Arısı)
  3. *Apis mellifera caucasia* (Kafkas Arısı - 7,2 mm uzun dilli dağ arısı)
  4. *Apis mellifera mellifera* (Avrupa Esmer Arısı)
  5. *Apis cerana* (Doğu Asya Arısı)
- **Özel Genetik Mühendisi (CRISPR Suite):**
  - Boyut çarpanı (0.75× – 1.6×)
  - Dil uzunluğu (6.2 – 7.2 mm, derin çiçek tüplerine erişim)
  - Kitin gövde rengi ve karın çizgi tonu
  - Kıl yoğunluğu
  - Saldırganlık, Tarlacılık hızı, Petek örme oranı, Soğuk toleransı

### 5. İklim & Işık Spektrumu Çevre Kontrolü
- Sıcaklık (10°C – 42°C): <14°C Kış Salkımı, 14–34°C Denge, 34–36°C Havalandırma, >36°C Kuluçka Stresi
- Bağıl Nem (%25 – %95 RH)
- Barometrik Basınç (980 – 1030 hPa): <995 hPa fırtına uyarısıyla tarlacıların kovana dönüşü
- **5 Gözlem Işık Modu ve Bilgi Kartları:**
  - Gün Işığı (5500K)
  - UV Arı Görüşü (300–400 nm nektar kılavuzları & çiçek floresansı)
  - Kızılötesi (680 nm gece laboratuvar gözlemi)
  - Altın Saat (Sunset)
  - Özel Spektrum (0°–360° renk dalga boyu çarkı)

### 6. Web Audio API Gerçek Zamanlı Sentez Motoru
- Sıfır `.mp3` bağımlılığı; tarayıcıda canlı osilatör ve filtrelerle üretilir:
  - 215 Hz, 322 Hz, 517 Hz harmonik kanat taşıyıcıları
  - 300–900 Hz Biquad bant geçiren filtre
  - 107 Hz sinüs gövde rezonansı
  - 0.6 Hz LFO nefes modülasyonu
  - 320–450 Hz savunma çığlığı ve 175 Hz duman sakinliği crossfade geçişleri
  - Prosedürel duman üfleme tıslaması ve cam rezonans vuruş sesleri

---

## 🕹️ Kısayol Tuşları (Hotkeys)

| Tuş | Eylem | Cooldown |
|---|---|---|
| `Space` | Simülasyonu Duraklat / Devam Ettir | — |
| `S` | Duman Körüğü Üfle (Puff Smoker) | 8 sn |
| `W` | Avcı Tehdidi Başlat (Wasp Attack) | 25 sn |
| `T` | Kovan Camına Vur (Glass Tap) | 4 sn |
| `H` | Zen Modu (Alt Paneli Gizle / Göster) | — |
| `1` | 1: Tam Kovan Genel Görünümü | — |
| `2` | 2: Kuluçka Peteği Yakın Planı | — |
| `3` | 3: Ana Arı Sarayı Odaklanma | — |
| `4` | 4: Üst Çiçek Bahçesi & Nektarlık | — |
| `5` | 5: Uçuş Giriş Ağzı & Muhafızlar | — |
| `Alt+1…5` | Hazır 5 Alt Türden Birini Seç | — |

---

## 🚀 Kurulum & Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Birim testleri çalıştırın
npm test

# Üretim derlemesi
npm run build
```
