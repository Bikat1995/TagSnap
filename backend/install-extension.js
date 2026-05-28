const { Client } = require('pg');
require('dotenv').config();

async function installUuidExtension() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID-OSSP extension installed successfully');
  } catch (err) {
    console.error('Error installing extension:', err);
  } finally {
    await client.end();
  }
}

installUuidExtension();
