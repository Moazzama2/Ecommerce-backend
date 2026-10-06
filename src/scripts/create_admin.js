import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../modules/users/user.model.js';
import logger from '../utils/logger.js';

// ============================================================
// CREATE / PROMOTE AN ADMIN
//
//   node --env-file=.env src/scripts/create_admin.js <email> [name] [password]
//
// - If the email exists → promoted to admin (password untouched).
// - Otherwise a new admin is created (password required, min 8 chars).
// ============================================================

const [, , email, name, password] = process.argv;

if (!email) {
  console.error('Usage: node --env-file=.env src/scripts/create_admin.js <email> [name] [password]');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Already an admin: ${existing.email}`);
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted to admin: ${existing.email}`);
    }
  } else {
    if (!password || password.length < 8) {
      console.error('New admin needs a password of at least 8 characters.');
      process.exit(1);
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name || 'Admin',
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin: ${user.email}`);
  }

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`create_admin failed: ${error.message}`);
    console.error(error.message);
    process.exit(1);
  });
