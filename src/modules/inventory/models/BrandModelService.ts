// BrandModelService.ts
// Manages brands and models in Firestore.
// Collections: `brands` + `brandModels`
//
// ⚠️  IF BRANDS ARE MISSING (e.g. only "Hh" shows up):
//     Your Firestore already has stale data so seedIfEmpty() skips re-seeding.
//     Fix: call forceReseed() ONCE from a dev button or temporary useEffect:
//
//       import { forceReseed } from '../models/BrandModelService';
//       await forceReseed();   // wipes brands + brandModels, writes all 33
//
//     Remove the call after it runs — it is destructive.

import {
  collection, getDocs, addDoc, doc, updateDoc,
  query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandModel {
  id:     string;
  name:   string;
  models: ModelEntry[];
}

export interface ModelEntry {
  id:         string;
  brandId:    string;
  name:       string;
  costPrice?: number;
  sellPrice?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection names
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS_COL = 'brands';
const MODELS_COL = 'brandModels';

// ─────────────────────────────────────────────────────────────────────────────
// Master seed — 33 brands, complete model lists
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_BRANDS: { name: string; models: string[] }[] = [
  { name: 'AKA',                            models: ['Signum HM', 'AKA Signum MFD', 'AKA-SIGNUM Coil 15"', 'HF RANDOM', 'AKA INTRONIKA', 'Smart Pulse'] },
  { name: 'AS DETECTORS',                   models: ['Multi max'] },
  { name: 'Andralian',                      models: ['Andralian'] },
  { name: 'Black Dog Xtreme',               models: ['Black Dog'] },
  { name: 'Bounty Hunter VLF',              models: ['Bounty Hunter'] },
  { name: 'China',                          models: ['GDX 8000', 'Gold Hunter', 'TIANXUN', 'VRP 1000'] },
  { name: 'DHFHJ',                          models: ['Armest * 17'] },
  { name: 'Detector',                       models: ['Metal Detector'] },
  { name: 'Detek',                          models: ['Detek Coil'] },
  { name: 'EKibi',                          models: ['EKIBI T1', 'Ekibi VLF DETECTOR', 'EKIBI M1', 'EKIBI EMF System'] },
  { name: 'Fisher',                         models: ['Fisher f75', 'Fisher F11', 'Fisher F22', 'F44', 'Fisher F44', 'Fisher GOLDBUG'] },
  { name: 'GEOGROUND',                      models: ['Gold Legend'] },
  { name: 'GOLD XTRA',                      models: ['GOLD XTRA GX', 'GOLD XTRA TGX PRO', 'GOLD XTRA TGX LITE', 'GOLD XTRA TGX PRO PLUS', 'GOLD XTRA REVEALER', 'Unveiler'] },
  { name: 'GTR TURKEY',                     models: ['GTR TURKEY'] },
  { name: 'Garrett',                        models: ['Garrett Metal Detector 400i', 'Garrett Metal Detector-AT Gold', 'Garrett Metal Detector- Pro Pointer AT', 'Garrett Metal Detector-300i', 'Garrett Metal Detector-2500', 'Garrett Ace Apex', 'Garrett Paining Kit', 'Gold Master 24k', 'Garrett Metal Detector 200i', 'Apex', 'Garrett 200i', 'Garrett 400i'] },
  { name: 'Gold Star',                      models: ['GOLD STAR GT-18 Accessories', 'GOLD STAR GT 18'] },
  { name: 'Gold Stinger X5',               models: ['Gold Stinger X5'] },
  { name: 'Hira Dedector',                  models: ['GTR'] },
  { name: 'JOKER',                          models: ['Joker X2'] },
  { name: 'Lorenz',                         models: ['Lorenz Deepmax Z1', 'Lorenz Deepmax Z2'] },
  { name: 'Minelab',                        models: ['Minelab GPX Coil', 'Minelab Gold Monster 1000', 'GPX 5000', 'SDC 2300'] },
  { name: 'Multimax',                       models: ['Multimax'] },
  { name: 'Nokta',                          models: ['Simplex', 'Mini Hoard', 'Au Gold Finder Controller', 'C45 Coil', 'CF 77', 'Gold Kruzer', 'Gold Racer', 'Impact Pro', 'Jeo Hunter 3D', 'Racer 2', 'Pinpointer PulseDive', 'Pointer', 'Premium Gold Digger', 'Scuba Coil', 'REPLACEABLE SCUBA COIL UNIT BLACK -PD', 'Simplex BT', 'Simplex Ultra', 'T44 Search Coil', 'TMD101', 'Wireless Head Phones', 'Simplex Lite', 'Simplex Plus', 'Nokta FindX', 'Nokta FindX Pro', 'Nokta Score', 'Nokta Score 3 ProPack', 'IM45 Coil', 'The Legend', 'PIMAX', 'Triple Score', 'Accu Pointer'] },
  { name: 'Nokta Makro',                    models: ['NOKTA Mini Hoard', 'NOkTA Au Gold Finder Controller', 'The legend', 'Nokta Simplex Plus', 'Triple Score', 'Nokta Impact Pro', 'Score'] },
  { name: 'OKM',                            models: ['OKM EXP 6000 PROFESSIONAL PLUS', 'OKM Water Detector', 'Okm Detta Ranger Professional Plus', 'OkM Delta Ranger Professional'] },
  { name: 'OKM EXP 6000 PROFESSIONAL PLUS', models: [] },
  { name: 'PMX',                            models: ['PMX GOLD', 'Pimax Expert Multi'] },
  { name: 'Quest',                          models: ['Quest Pinpointer', 'Quest Q35', 'Quest Scuba', 'Quest V80', 'Quest X5', 'Quest V60', 'Quest X10Pro', 'X10 ID Maxx', 'X5 ID Maxx', 'Quest Xpointer Maxx'] },
  { name: 'Reaper 2',                       models: ['Reaper 2'] },
  { name: 'Super Wand',                     models: ['Hand-Held Secutiry Detector'] },
  { name: 'Teknetics',                      models: ['Teknetics Alpha', 'Teknetics Delta', 'Teknetics Eurotek', 'Teknetics Eurotek Pro', 'Teknetics G2+', 'Teknetics T2', 'Alpha'] },
  { name: 'WHITES',                         models: ['WHITES SUPER GMT', 'WHITES TM 808'] },
  { name: 'X5 ID Maxx',                     models: [] },
  { name: 'XP',                             models: ['ORX CHARGER', 'WS5 Head Phones', 'XP DEUS', 'XP Deus 13"', 'XP Dues II', 'XP Gold Batea Kit', 'XP Gold Prospecting Sluice', 'XP HF 5" Coil', 'XP PANNING KIT', 'XP-GMAXXX II', 'XP- Gmaxx II', 'XP-Gmaxx Power', 'XP-MI-4', 'XP-ORX', 'XP Dues Control Unit', 'XP Sluice'] },
  { name: 'Practice',                       models: ['Testing Model', 'EvenTracking'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function deleteCollection(colName: string): Promise<void> {
  const snap = await getDocs(collection(db, colName));
  if (snap.empty) return;
  let batch = writeBatch(db);
  let n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    n++;
    if (n >= 490) { await batch.commit(); batch = writeBatch(db); n = 0; }
  }
  if (n > 0) await batch.commit();
}

async function writeSeedData(): Promise<void> {
  let batch = writeBatch(db);
  let n = 0;

  const flush = async () => {
    if (n > 0) { await batch.commit(); batch = writeBatch(db); n = 0; }
  };

  for (const brand of SEED_BRANDS) {
    const brandRef = doc(collection(db, BRANDS_COL));
    batch.set(brandRef, { name: brand.name, createdAt: serverTimestamp() });
    n++;
    for (const modelName of brand.models) {
      const modelRef = doc(collection(db, MODELS_COL));
      batch.set(modelRef, { brandId: brandRef.id, name: modelName, createdAt: serverTimestamp() });
      n++;
      if (n >= 490) await flush();
    }
  }
  await flush();
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  forceReseed — DESTRUCTIVE. Call once to fix stale Firestore data.
//     After running, remove the call from your code.
// ─────────────────────────────────────────────────────────────────────────────

let _seeded = false;

export async function forceReseed(): Promise<void> {
  console.log('⚠️  forceReseed: clearing brands & brandModels…');
  await Promise.all([
    deleteCollection(BRANDS_COL),
    deleteCollection(MODELS_COL),
  ]);
  _seeded = false;
  console.log('🌱 Writing all 33 brands…');
  await writeSeedData();
  _seeded = true;
  console.log('✅ forceReseed done — reload the page');
}

// ─────────────────────────────────────────────────────────────────────────────
// seedIfEmpty — normal startup path
// ─────────────────────────────────────────────────────────────────────────────

async function seedIfEmpty(): Promise<void> {
  if (_seeded) return;
  const snap = await getDocs(collection(db, BRANDS_COL));
  if (!snap.empty) { _seeded = true; return; }
  console.log('🌱 First run — seeding brands…');
  await writeSeedData();
  _seeded = true;
  console.log('✅ Seed complete');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchBrands(): Promise<BrandModel[]> {
  await seedIfEmpty();

  const [brandsSnap, modelsSnap] = await Promise.all([
    getDocs(query(collection(db, BRANDS_COL), orderBy('name'))),
    getDocs(query(collection(db, MODELS_COL), orderBy('name'))),
  ]);

  const modelsMap: Record<string, ModelEntry[]> = {};
  modelsSnap.docs.forEach(d => {
    const m = d.data() as any;
    if (!modelsMap[m.brandId]) modelsMap[m.brandId] = [];
    modelsMap[m.brandId].push({
      id: d.id, brandId: m.brandId, name: m.name,
      costPrice: m.costPrice, sellPrice: m.sellPrice,
    });
  });

  return brandsSnap.docs.map(d => ({
    id:     d.id,
    name:   (d.data() as any).name,
    models: modelsMap[d.id] ?? [],
  }));
}

export async function addBrand(name: string): Promise<BrandModel> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Brand name cannot be empty');
  const ref = await addDoc(collection(db, BRANDS_COL), { name: trimmed, createdAt: serverTimestamp() });
  return { id: ref.id, name: trimmed, models: [] };
}

export async function addModel(brandId: string, modelName: string): Promise<ModelEntry> {
  const trimmed = modelName.trim();
  if (!trimmed) throw new Error('Model name cannot be empty');
  if (!brandId)  throw new Error('brandId is required');
  const ref = await addDoc(collection(db, MODELS_COL), { brandId, name: trimmed, createdAt: serverTimestamp() });
  return { id: ref.id, brandId, name: trimmed };
}

export async function updateModelPrices(modelId: string, costPrice: number, sellPrice: number): Promise<void> {
  await updateDoc(doc(db, MODELS_COL, modelId), { costPrice, sellPrice });
}