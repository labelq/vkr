const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/puc_learning'
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

module.exports = pool;
