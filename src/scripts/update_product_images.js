/**
 * update_product_images.js
 * ─────────────────────────────────────────────────────────────────
 * Run: node --env-file=.env src/scripts/update_product_images.js
 *
 * Edit the `imageMap` below — add as many image URLs as you want
 * for each product (you can paste any https:// URL).
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import Product from '../modules/products/product.model.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('✅  Connected to MongoDB\n');

// ─────────────────────────────────────────────────────────────────
//  📝  EDIT YOUR IMAGE URLS HERE
//  Key  = MongoDB _id of the product
//  Value = array of image URLs (add as many as you want)
// ─────────────────────────────────────────────────────────────────
const imageMap = {

  // Dell XPS 15
  '6a8bf36b9dc9c4a86e7be537': [
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
  ],

  // MacBook Pro 16-inch
  '6a8bf33e9dc9c4a86e7be536': [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
  ],

  // Apple AirPods Pro
  '6a8bf30e9dc9c4a86e7be535': [
    'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800',
  ],

  // Sony WH-1000XM4 Headphones
  '6a8bf2d59dc9c4a86e7be534': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  ],

  // A Brief History of Time
  '6a8bf2729dc9c4a86e7be533': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
  ],

  // To Kill a Mockingbird
  '6a8bf2309dc9c4a86e7be532': [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
  ],

  // The Great Gatsby
  '6a8bf1a39dc9c4a86e7be531': [
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
  ],

  // Wireless Headphones
  '6a882cb4aa7e5303f9ed95a5': [
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
  ],

  // Cotton T-Shirt
  '6a882c90aa7e5303f9ed95a4': [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  ],

  // pen
  '6a882bd3aa7e5303f9ed95a2': [
    'https://images.unsplash.com/photo-1583394293214-0d4b00de5197?w=800',
  ],

};
// ─────────────────────────────────────────────────────────────────

let updated = 0;
let failed  = 0;

for (const [id, urls] of Object.entries(imageMap)) {
  if (!urls || urls.length === 0) continue;

  try {
    const result = await Product.findByIdAndUpdate(
      id,
      { $set: { images: urls } },
      { new: true }
    );

    if (result) {
      console.log(`✅  ${result.name}`);
      urls.forEach(u => console.log(`       ${u}`));
      updated++;
    } else {
      console.log(`⚠️   ID not found: ${id}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌  Error updating ${id}:`, err.message);
    failed++;
  }
}

console.log(`\n📦  Done — ${updated} updated, ${failed} failed.`);
await mongoose.disconnect();
