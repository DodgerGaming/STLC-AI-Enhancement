import sqlite3, json
conn = sqlite3.connect('backend/db.sqlite3')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
rows = cur.fetchall()
print('Tables:', rows)
# count rows per table
for (t,) in rows:
    cur.execute(f"SELECT count(*) FROM '{t}'")
    c = cur.fetchone()[0]
    print(t, c)
