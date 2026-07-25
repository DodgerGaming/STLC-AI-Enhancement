import os
import psycopg2
import clickhouse_connect
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()  # reads .env file in the same folder

# ===== CONFIG =====
PG_CONFIG = {
    "host": os.getenv("PG_HOST"),
    "dbname": os.getenv("PG_DB"),
    "user": os.getenv("PG_USER"),
    "password": os.getenv("PG_PASSWORD"),
    "port": int(os.getenv("PG_PORT")),
}

CH_CONFIG = {
    "host": os.getenv("CH_HOST"),
    "port": int(os.getenv("CH_PORT")),
    "username": os.getenv("CH_USER"),
    "password": os.getenv("CH_PASSWORD"),
}

TEST_LIMIT = 100

# ===== EXTRACT =====
JOIN_QUERY = """
    SELECT
        oi.id                AS order_item_id,
        o.order_id,
        o.customer,
        o.fulfillment,
        o.delivery_address,
        o.scheduled_date,
        o.scheduled_time,
        o.payment_method,
        o.status,
        o.created_at,
        oi.material_name,
        oi.batch_code,
        oi.unit,
        oi.unit_price,
        oi.qty,
        oi.size_sqft,
        oi.custom_size,
        oi.color
    FROM api_orderitem oi
    JOIN api_order o ON o.order_id = oi.order_id
    ORDER BY o.created_at
    LIMIT %s;
"""

def extract(limit=TEST_LIMIT):
    conn = psycopg2.connect(**PG_CONFIG)    
    cur = conn.cursor()
    cur.execute(JOIN_QUERY, (limit,))
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    print(f"Extracted {len(rows)} rows from Postgres.")
    return columns, rows

# ===== TRANSFORM (light cleaning only) =====
def transform(columns, rows):
    cleaned = []
    for row in rows:
        record = dict(zip(columns, row))
        record["size_sqft"] = record["size_sqft"] if record["size_sqft"] is not None else None
        record["custom_size"] = record["custom_size"] if record["custom_size"] else None
        record["delivery_address"] = record["delivery_address"] or ""
        record["color"] = record["color"] or ""
        record["unit_price"] = Decimal(record["unit_price"])
        record["scheduled_time"] = str(record["scheduled_time"]) if record["scheduled_time"] else None
        cleaned.append(record)
    print(f"Transformed {len(cleaned)} rows.")
    return cleaned

# ===== LOAD =====
def load(records):
    client = clickhouse_connect.get_client(**CH_CONFIG)
    column_order = [
        "order_item_id", "order_id", "customer", "fulfillment",
        "delivery_address", "scheduled_date", "scheduled_time",
        "payment_method", "status", "created_at", "material_name",
        "batch_code", "unit", "unit_price", "qty", "size_sqft",
        "custom_size", "color"
    ]
    data = [[record[col] for col in column_order] for record in records]
    client.insert("order_items_flat", data, column_names=column_order)
    print(f"Inserted {len(data)} rows into ClickHouse.")

# ===== RUN =====
if __name__ == "__main__":
    columns, rows = extract()
    if not rows:
        print("No rows returned — check your Postgres connection/query.")
    else:
        records = transform(columns, rows)
        load(records)
        print("Test batch complete.")