require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database');

async function main() {
  console.log('Connecting to database...');

  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('Schema ready (tables: products, admins)');

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
  }

  const existing = await db.query(
    'SELECT id FROM admins WHERE username = $1',
    [username]
  );

  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      [username, hash]
    );
    console.log(`Admin user "${username}" created`);
  } else {
    console.log(`Admin user "${username}" already exists — skipping`);
  }

  console.log('Database ready.');
  await db.pool.end();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
