# North — Yazı Editörü

North — akış modu, dallanma ve canlı taslak destekli, production-ready Electron yazı editörü.

## Özellikler

- **Zengin metin editörü** — kalın, italik, altı çizili, renk, font, başlıklar, listeler
- **Canlı taslak** — başlıklardan otomatik outline, sürükle-bırak desteği
- **Dallanma** — belgeleri dallara ayır, dal karşılaştırma (diff)
- **Markdown** — WYSIWYG ↔ Markdown çift yönlü dönüşüm, split görünüm
- **Akış Modu (✨)** — Anthropic Claude ile güvenli main-process proxy üzerinden devam önerisi (Tab/ Esc)
- **Sesli diktatör** — tarayıcı SpeechRecognition ile Türkçe dikte
- **Tema** — cihaza saate göre otomatik (şafak/gün/akşam/gece) + manuel kaydırıcı
- **Kalıcı kayıt** — dosya sistemi (Kaydet/Aç), localStorage otomatik kurtarma, dirty takibi
- **Güvenlik** — contextIsolation + preload + contextBridge, API anahtarı main-process'te saklı
- **Menü & kısayollar** — Ctrl+N/O/S, Dosya/Düzen/Görünüm menüleri, son dosyalar

## Gereksinimler

- Node.js 18+ (https://nodejs.org)

## Kurulum

```bash
cd north
npm install
```

## Geliştirme

```bash
npm start        # Electron penceresini açar
npm run dev      # log açık mod
```

## Build

```bash
npm run dist        # tüm platformlar
npm run dist:win    # sadece Windows NSIS
npm run pack        # paketlenmeden test (dist olmadan)
```

Çıktı `dist/` klasörüne `North Setup 0.1.0.exe` olarak üretilir. macOS/Linux'tan Windows hedefi için `wine` gerekir; en sorunsuz yol Windows'ta veya CI'da derlemek.

## İkon

`icon.ico` (Windows) ve `icon.icns` (mac) dosyalarını bu klasöre koyun. `package.json` build ayarları zaten bunları işaret ediyor.

## Akış Modu API Anahtarı

1. Uygulamayı açın → sağ panel **Akış Modu Ayarı**
2. Anthropic API anahtarınızı (`sk-ant-...`) girip **Kaydet** deyin
3. Anahtar `userData/north-store.json` içinde şifreli olmadan saklanır (cihazda kalır, dışarı gönderilmez)
4. Alternatif: ortam değişkeni `ANTHROPIC_API_KEY` tanımlayın, anahtar yoksa fallback olarak kullanılır

> Akış istekleri artık renderer'dan değil, main-process proxy üzerinden gider; anahtar DevTools'ta görünmez.

## Dosya Formatı

- **Kaydet** (Ctrl+S): mevcut dosyaya yazar, yoksa Farklı Kaydet açar
- **Aç** (Ctrl+O): `.html`, `.md`, `.txt` destekler
- Otomatik kurtarma: her değişiklik `localStorage`'a yazılır, çökme sonrası geri yüklenir
- Kapanırken kaydedilmemiş değişiklik varsa onay dialogu çıkar

## Mimari

```
main.js      — Electron main process: pencere, menü, dosya IPC, store, flow proxy
preload.js   — contextBridge: güvenli API köprüsü (northAPI)
north.html   — tek dosya UI: HTML + CSS + JS (production iyileştirmeleri ile)
package.json — build ve script tanımları
```

## Güvenlik Notları

- `contextIsolation: true`, `nodeIntegration: false`, `preload` zorunlu
- Harici linkler `shell.openExternal` ile tarayıcıda açılır
- CSP meta tag ile `connect-src` kısıtlı
- Tek instance lock aktif

## Lisans

MIT
