
const pg = require('pg');
const fs = require('fs');
(async () => {
  const pool = new pg.Pool({ host: '127.0.0.1', database: 'virtual_class', user: 'vcuser', password: 'vcpass123' });
  const client = await pool.connect();
  await client.query('CREATE TABLE IF NOT EXISTS _migrations(id SERIAL PRIMARY KEY,name VARCHAR(255) UNIQUE,executed_at TIMESTAMPTZ DEFAULT NOW())');
  const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const { rows } = await client.query('SELECT id FROM _migrations WHERE name=$1', [f]);
    if (rows.length === 0) {
      const sql = fs.readFileSync('./migrations/' + f, 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES($1)', [f]);
        console.log('✓ 迁移完成:', f);
      } catch (e) { console.log('✗ 迁移失败:', f, e.message); }
    } else {
      console.log('  跳过 (已执行):', f);
    }
  }
  client.release();
  process.exit(0);
})()