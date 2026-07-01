import sqlite3
from pathlib import Path
p = Path('backend/db.sqlite3')
conn = sqlite3.connect(p)
cur = conn.cursor()
print('tables:', [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")])
print('schema api_audittrail:', list(cur.execute("PRAGMA table_info('api_audittrail')")))
try:
    print('sample rows:', list(cur.execute("SELECT id, user, user_id, entity_type, entity_id, action FROM api_audittrail LIMIT 5")))
except Exception as exc:
    print('sample query failed:', exc)
conn.close()
