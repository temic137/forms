const { Client } = require('pg');
require('dotenv').config();

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

// Remove sslmode from the string so we can manually configure it
// We also need to handle if it's the first param (after ?) or subsequent (after &)
// Simplistic replacement:
dbUrl = dbUrl.replace(/[?&]sslmode=[^&]+/, '');
// Clean up double && or trailing ?/& if needed, but pg parser is usually robust.
// However, if we removed the first param, we might have `?&pgbouncer=...` which is invalid?
// Let's just rely on pg parsing connectionString and OVERRIDING it with ssl config.
// Actually, to override, we should pass connectionString and ssl config.
// But earlier test showed strict enforcement.
// Let's strip it carefully.

console.log('Original URL (masked):', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('Connecting with rejectUnauthorized: false ...');
    await client.connect();
    console.log('Connected successfully!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Server time:', res.rows[0].now);
    
    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();

