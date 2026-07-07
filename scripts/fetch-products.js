/**
 * Trendyol Seller API → products.json
 *
 * Çalıştırma:
 *   TRENDYOL_API_KEY=xxx TRENDYOL_API_SECRET=yyy TRENDYOL_SUPPLIER_ID=zzz node scripts/fetch-products.js
 *
 * GitHub Actions'da credentials otomatik gelir (Secrets'tan).
 * API bilgileri için: partner.trendyol.com → Hesabım → Entegrasyon Bilgileri
 *
 * Ağustos 2026'dan itibaren V1 API kapatılıyor — bu script V2 kullanır.
 */

import { writeFileSync } from 'fs';

const API_KEY     = process.env.TRENDYOL_API_KEY     || 'YOUR_API_KEY';
const API_SECRET  = process.env.TRENDYOL_API_SECRET  || 'YOUR_API_SECRET';
const SUPPLIER_ID = process.env.TRENDYOL_SUPPLIER_ID || 'YOUR_SUPPLIER_ID';

const BASE_URL = `https://api.trendyol.com/sapigw/suppliers/${SUPPLIER_ID}`;
const AUTH     = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
const HEADERS  = {
  'Authorization': `Basic ${AUTH}`,
  'User-Agent':    `${SUPPLIER_ID} - SemToys`,
  'Content-Type':  'application/json',
};

const PAGE_SIZE = 50;   // max 200, ama 50 güvenli
const RATE_MS   = 1200; // 60 req/min sınırı → 1.2s bekle

async function fetchPage(page) {
  const url = `${BASE_URL}/v2/products?approved=true&page=${page}&size=${PAGE_SIZE}`;
  const res = await fetch(url, { headers: HEADERS });

  if (res.status === 429) {
    const retry = parseInt(res.headers.get('Retry-After') || '60', 10);
    console.log(`Rate limit — ${retry}s bekleniyor...`);
    await sleep(retry * 1000);
    return fetchPage(page); // tekrar dene
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API Hata ${res.status}: ${body}`);
  }

  return res.json();
}

async function fetchAllProducts() {
  const all = [];
  let page = 0;

  while (true) {
    console.log(`Sayfa ${page} çekiliyor...`);
    const data  = await fetchPage(page);
    const items = data.content || [];

    all.push(...items);
    console.log(`  → ${items.length} ürün (toplam: ${all.length})`);

    const totalPages = data.totalPages ?? Math.ceil((data.totalElements ?? 0) / PAGE_SIZE);
    if (items.length < PAGE_SIZE || page >= totalPages - 1) break;

    page++;
    await sleep(RATE_MS);
  }

  return all;
}

function mapProduct(item) {
  // Trendyol API image formatı: [{ url: "https://cdn.dsmcdn.com/..." }]
  const image = item.images?.[0]?.url ?? '';

  // Trendyol ürün URL'sini supplierId ile oluştur
  const link = item.productUrl
    ?? `https://www.trendyol.com/magaza/sem-toys-m-1277968`;

  return {
    id:          String(item.id ?? item.barcode ?? item.stockCode ?? item.title),
    name:        item.title ?? '',
    price:       Math.round(item.salePrice ?? 0),
    marketPrice: Math.round(item.listPrice ?? item.salePrice ?? 0),
    image,
    link,
    stock:       item.quantity ?? 0,
    category:    item.categoryName ?? '',
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (API_KEY === 'YOUR_API_KEY') {
    console.error('API credentials eksik. GitHub Secrets\'a TRENDYOL_API_KEY, TRENDYOL_API_SECRET, TRENDYOL_SUPPLIER_ID ekle.');
    process.exit(1);
  }

  console.log('=== Trendyol Ürün Güncelleme ===');
  console.log(`Supplier ID: ${SUPPLIER_ID}`);

  const raw      = await fetchAllProducts();
  console.log(`\nToplam çekilen: ${raw.length} ürün`);

  const products = raw
    .filter(p => !p.archived)           // arşivlenenleri çıkar
    .map(mapProduct)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const outOfStock = products.filter(p => p.stock === 0).length;
  const inStock    = products.length - outOfStock;
  console.log(`Aktif: ${inStock} | Tükendi: ${outOfStock}`);

  const output = {
    updatedAt: new Date().toISOString(),
    source:    'trendyol-api',
    count:     products.length,
    products,
  };

  writeFileSync('./products.json', JSON.stringify(output, null, 2), 'utf8');
  console.log('\nproducts.json güncellendi.');
}

main().catch(err => {
  console.error('HATA:', err.message);
  process.exit(1);
});
