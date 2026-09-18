/**
 * Script: remove_duplicates.js
 * Run with: node --env-file=.env src/scripts/remove_duplicates.js
 *
 * Removes duplicate Product documents from MongoDB,
 * keeping only the most recently created one per (name, price) pair.
 */

import mongoose from 'mongoose';
import Product from '../modules/products/product.model.js';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌  MONGO_URI is not set. Make sure .env is loaded.');
  process.exit(1);
}

await mongoose.connect(uri);
console.log('✅  Connected to MongoDB\n');

// Find all products and group by name+price
const all = await Product.find({}).sort({ createdAt: 1 }).lean();
console.log(`📦  Total products before cleanup: ${all.length}`);

const seen = new Map(); // key → first _id to keep
const toDelete = [];

for (const p of all) {
  const key = `${p.name.trim().toLowerCase()}__${p.price}`;
  if (seen.has(key)) {
    toDelete.push(p._id);
    console.log(`  🗑  Duplicate found: "${p.name}" (${p.price}) → will delete _id=${p._id}`);
  } else {
    seen.set(key, p._id);
  }
}

if (toDelete.length === 0) {
  console.log('\n✅  No duplicates found. Database is already clean!');
} else {
  const result = await Product.deleteMany({ _id: { $in: toDelete } });
  console.log(`\n✅  Removed ${result.deletedCount} duplicate(s).`);
}

const remaining = await Product.countDocuments();
console.log(`📦  Total products after cleanup: ${remaining}`);

// List remaining products
const clean = await Product.find({}).select('name price').lean();
console.log('\nRemaining products:');
clean.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} — ${p.price}`));

await mongoose.disconnect();
console.log('\n🔌  Disconnected.');
