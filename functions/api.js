const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'axon.db'));
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        quantity INTEGER,
        description TEXT,
        front TEXT,
        back TEXT,
        variants TEXT
      );
    `);
  }
  return db;
}

exports.handler = async (event) => {
  const db = getDb();
  
  if (event.httpMethod === 'GET') {
    try {
      const visits = db.prepare('SELECT value FROM settings WHERE key = ?').get('visits')?.value || '0';
      const products = db.prepare('SELECT * FROM products').all();
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          initialized: true,
          backend: 'netlify',
          store: {
            visits: Number(visits),
            categories: ['All', 'Gym shirt', 'Oversized'],
            products: products.map(p => ({
              ...p,
              price: Number(p.price),
              quantity: Number(p.quantity),
              variants: JSON.parse(p.variants || '[]')
            }))
          }
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  if (event.httpMethod === 'PUT') {
    try {
      const { store } = JSON.parse(event.body);
      db.prepare('DELETE FROM products').run();
      
      store.products.forEach(p => {
        db.prepare('INSERT INTO products (id, name, category, price, quantity, description, front, back, variants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          p.id, p.name, p.category, p.price, p.quantity, p.description || '', p.front, p.back || p.front, JSON.stringify(p.variants || [])
        );
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
};
