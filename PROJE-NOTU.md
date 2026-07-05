# SemToys — Proje Notu

> Koleksiyon oyuncak satıcısı için vitrin web sitesi.  
> Ürünler Trendyol üzerinden satılıyor; site yalnızca tanıtım ve yönlendirme amacı taşıyor.

---

## 1. Domain Alım Süreci

### semtoys.com — Namecheap
- **Nereden:** [namecheap.com](https://www.namecheap.com)
- **Nasıl:** Arama → Sepet → Ödeme. Yıllık yaklaşık $10-15.
- **DNS Yönetimi:** Namecheap → Domain List → Manage → Advanced DNS

### semtoys.com.tr — isimtescil.net
- **Nereden:** [isimtescil.net](https://www.isimtescil.net)
- **Not:** Panel sadece nameserver değişikliği yapılabiliyor; tekil A/CNAME kaydı yok.
- **Çözüm:** Netlify DNS'e geçildi (nameserver yöntemi).

---

## 2. Hosting — Netlify

### Neden Netlify?
- Statik site için ücretsiz plan yeterli
- GitHub'a push yapınca otomatik deploy
- Custom domain + SSL ücretsiz

### Kurulum Adımları
1. [netlify.com](https://www.netlify.com) → Sign up → "Add new site" → "Import from Git"
2. GitHub hesabı bağla → `semtoys` reposu seç
3. Build komutu yok (saf HTML), publish directory: `.` (kök klasör)
4. Deploy → site yayında

### Netlify Üzerinden Domain Bağlama
- Site Settings → Domain Management → Add custom domain
- `semtoys.com` ekle → DNS doğrulaması

---

## 3. DNS Bağlama

### semtoys.com → Netlify (Namecheap Advanced DNS)
Namecheap panelinde şu kayıtlar eklendi:

| Type  | Host | Value                  |
|-------|------|------------------------|
| A     | @    | 75.2.60.5              |
| CNAME | www  | [site-adi].netlify.app |

> Netlify'ın verdiği IP ve subdomain değerleri buraya girilir.  
> Yayılma süresi: 10 dakika – 48 saat.

### semtoys.com.tr → Netlify (Nameserver yöntemi)
isimtescil.net panelinde nameserver'lar Netlify DNS ile değiştirildi:

```
dns1.p02.nsone.net
dns2.p02.nsone.net
dns3.p02.nsone.net
dns4.p02.nsone.net
```

> Netlify tarafında domain eklendikten sonra panel otomatik Netlify DNS kayıtlarını oluşturur.  
> İki domain da aynı Netlify sitesini gösteriyor; güncellemeler ikisine de anlık yansıyor.

---

## 4. GitHub Repo

- **Repo:** `https://github.com/erhanyalcinenm/semtoys.git`
- **Branch:** `master`
- **Bağlantı:** Netlify → GitHub (OAuth) → repo seçimi → her `git push` otomatik deploy tetikler

### İlk Kurulum (sıfırdan)
```powershell
cd c:/syst/semtoys
git init
git config user.email "erhanyalcin.enm@gmail.com"
git config user.name "Erhan Yalcin"
git remote add origin https://github.com/erhanyalcinenm/semtoys.git
git add .
git commit -m "initial commit"
git push -u origin master
```

> Git config satırları önemli — yoksa "unable to auto-detect email" hatası verir.

---

## 5. Proje Dosya Yapısı

```
c:/syst/semtoys/
├── index.html           ← Tek sayfa, tüm site burası
├── style.css            ← Tüm stiller
├── logo2.png            ← Şeffaf arka planlı logo (remove.bg ile düzenlendi)
├── logo.jpeg            ← Orijinal logo (artık kullanılmıyor)
├── urunler.txt          ← Excel'den çıkarılan ham ürün verisi (boru | ayraçlı)
├── product-cards.html   ← Geçici: otomatik üretilen ürün kartı HTML'i
└── Ürünleriniz_05.07.2026-22.25.xlsx  ← Trendyol satıcı paneli export
```

---

## 6. Tasarım

### İlham
- **bashobby.com** — renk kullanımı, layout, ürün kart yapısı referans alındı

### Renk Paleti (logo'dan türetildi)
```css
:root {
  --orange: #F5821F;   /* logo E, O harfleri */
  --purple: #7B2FC9;   /* logo S, Y harfleri */
  --blue:   #1AA8E8;   /* logo M, T, S harfleri */
  --dark:   #0D1530;   /* header arka plan */
  --dark2:  #1a1a3a;   /* footer arka plan */
}
```

### Logo
- Orijinal `logo.jpeg` koyu lacivert arka planlıydı → beyaz header'da bozuk görünüyordu
- **remove.bg** sitesiyle arka plan kaldırıldı → `logo2.png` olarak kaydedildi
- Header'da `height: 80px; width: auto;`

### Yapı (index.html bölümleri)
1. **Announcement bar** — mor şerit, kargo kampanyası
2. **Header** — logo + arama barı + aksiyon butonları + sticky nav
3. **Hero** — başlık, açıklama, CTA butonu
4. **Kategoriler** — 4 kategori kartı (Trendyol mağazasına link)
5. **Ürünler** — 77 ürün kartı
6. **Promo banner** — ara tanıtım bölümü
7. **Footer** — linkler, sosyal medya, telif
8. **WhatsApp butonu** — sayfanın sağ alt köşesinde yüzen ikon

---

## 7. Ürün Verisi

### Kaynak
- Trendyol Satıcı Paneli → Ürünleriniz → Excel export (`.xlsx`)
- 116 satır, 34 sütun

### Önemli Sütunlar
| Sütun No | İçerik           |
|----------|------------------|
| 12       | Ürün Adı         |
| 14       | Piyasa Fiyatı    |
| 15       | Satış Fiyatı     |
| 21       | Görsel 1 (URL)   |
| 22–28    | Görsel 2–8       |
| 32       | Durum (Aktif/Arşivlendi) |
| 34       | Trendyol Ürün Linki |

### Excel'den Veri Çıkarma (PowerShell)
```powershell
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open("C:\syst\semtoys\Ürünleriniz_05.07.2026-22.25.xlsx")
$ws = $wb.Sheets.Item(1)
# satır döngüsü → urunler.txt'e yaz
```

### Görsel Stratejisi
- Trendyol CDN URL'leri doğrudan kullanılıyor (`cdn.dsmcdn.com`)
- Hotlink riski var: Trendyol erişimi keserse görseller kaybolur
- Çözüm: Görselleri indirip `/img/` klasörüne atmak (henüz yapılmadı)

### Satış Stratejisi
- Her ürün kartı → o ürünün kendi Trendyol sayfasına link veriyor
- `merchantId=1277968` parametresi URL'lere eklendi (Trendyol mağaza kimliği)
- Ödeme, kargo, iade tamamen Trendyol altyapısı

---

## 8. Özellikler (Geliştirme Sırası)

### v1 — Temel Site
- HTML/CSS ile statik sayfa
- Ürün listesi manuel

### v2 — Gerçek Ürünler
- Excel'den 77 aktif ürün PowerShell script ile çekilerek HTML'e eklendi
- Her ürün kendi Trendyol linkine sahip
- Arşivlenenler otomatik filtrelendi

### v3 — Responsive
- `@media (max-width: 1024px)` — tablet
- `@media (max-width: 768px)` — mobil
- `@media (max-width: 400px)` — küçük ekran
- Grid: masaüstü 4-5 sütun → tablet 3 → mobil 2

### v4 — Lightbox (Görsel Büyütme)
- Ürün görseline tıklayınca tam ekran modal açılıyor
- Kapatma: × butonu / dışına tıkla / Escape tuşu
- Scroll kilidi (`body overflow: hidden`)

### v5 — Arama
- Anlık filtreleme (harf harf)
- `data-name` attribute ile ürün adına göre
- Eşleşme yoksa "bulunamadı" mesajı

### v6 — Favoriler
- Kalp butonu (♡ / ♥) her kartta
- Tıklayınca kırmızıya döner, favorilere eklenir
- Header'daki ❤️ Favoriler butonunda sayı badge'i
- Sağdan kayan panel (drawer): görsel + ad + fiyat + Trendyol linki
- Panelden tek tek silme
- **localStorage'da kalıcı** — sayfa kapatılsa bile kaybolmaz

---

## 9. Yapılacaklar / Eksikler

| Görev | Durum | Not |
|-------|-------|-----|
| WhatsApp butonu numarası | Bekliyor | `href="#"` yerine `wa.me/90XXXXXXXXXX` |
| Instagram linki | Bekliyor | Footer'da `#` |
| Facebook linki | Bekliyor | Footer'da `#` |
| YouTube linki | Bekliyor | Footer'da `#` |
| Hakkımızda sayfası | Bekliyor | Ayrı `.html` veya modal |
| İletişim sayfası | Bekliyor | Ayrı `.html` veya modal |
| Görsel indirme | Bekliyor | CDN yerine `/img/` klasörü |
| Çoklu görsel galerisi | Bekliyor | Excel'de Görsel 2–8 mevcut |
| Kategori linkleri | Bekliyor | Nav'daki alt linkler filtreli Trendyol sayfasına gidecek |
| .com.tr yayılma | Bekliyor | Nameserver değişikliği propagation süreci |

---

## 10. Sıfırdan Kurmak İçin Adım Adım

1. **Domain al** → Namecheap'ten `.com`, isimtescil.net'ten `.com.tr`
2. **GitHub reposu aç** → `semtoys` adında public repo
3. **Netlify hesabı aç** → GitHub ile bağla → repo seç → deploy
4. **Netlify'a domain ekle** → Site Settings → Domain Management
5. **Namecheap DNS'e A + CNAME kaydı gir** (Netlify'ın verdiği değerler)
6. **isimtescil nameserver'larını Netlify DNS ile değiştir**
7. **Trendyol'dan Excel export al** → PowerShell ile parse et → ürün kartları üret
8. **Logo'yu remove.bg ile arka plansız hale getir** → `logo2.png` kaydet
9. **Git'e push at** → Netlify otomatik deploy eder
10. **DNS yayılmasını bekle** (10 dk – 48 saat)

---

## 11. Teknik Referanslar

- **Netlify Docs:** https://docs.netlify.com/domains-https/custom-domains/
- **Trendyol Mağaza:** https://www.trendyol.com/magaza/sem-toys-m-1277968
- **GitHub Repo:** https://github.com/erhanyalcinenm/semtoys
- **remove.bg:** https://www.remove.bg (logo arka plan kaldırma)

---

*Son güncelleme: 2026-07-05*
