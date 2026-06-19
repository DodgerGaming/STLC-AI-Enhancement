import sqlite3, json
conn = sqlite3.connect('backend/db.sqlite3')
cur = conn.cursor()
cur.execute('SELECT order_id, customer, created_at FROM api_order ORDER BY created_at DESC LIMIT 5')
rows = cur.fetchall()
print(json.dumps(rows, default=str, indent=2))
