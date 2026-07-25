import os
import psycopg2
import clickhouse_connect
from decimal import Decimal
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# ---------- CONFIG ----------
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

TABLE_NAME = "order_items_flat"

# ---------- WATERMARK ----------
def get_last_synced_id(client):
    """Ask ClickHouse for the highest order_item_id already loaded.
    Returns None if the table is empty (first run)."""
    result = client.query(f"SELECT max(order_item_id) AS latest FROM {TABLE_NAME}")
    latest = result.result_rows[0][0]
    return latest  # None if table is empty

# ---------- EXTRACT ----------
def build_query(since_id):
    base_query = """
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
    """
    if since_id is not None:
        base_query += " WHERE oi.id > %s"
        base_query += " ORDER BY oi.id;"
        return base_query, (since_id,)
    else:
        base_query += " ORDER BY oi.id;"
        return base_query, ()

def extract(since_id):
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()
    query, params = build_query(since_id)
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    print(f"Extracted {len(rows)} new rows from Postgres.")
    return columns, rows

# ---------- TRANSFORM (light cleaning only) ----------
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

# ---------- LOAD ----------
def load(client, records):
    column_order = [
        "order_item_id", "order_id", "customer", "fulfillment",
        "delivery_address", "scheduled_date", "scheduled_time",
        "payment_method", "status", "created_at", "material_name",
        "batch_code", "unit", "unit_price", "qty", "size_sqft",
        "custom_size", "color"
    ]
    data = [[record[col] for col in column_order] for record in records]
    client.insert(TABLE_NAME, data, column_names=column_order)
    print(f"Inserted {len(data)} rows into ClickHouse.")

# ---------- RUN ----------
if __name__ == "__main__":
    print(f"\n=== Extraction started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n")

    ch_client = clickhouse_connect.get_client(**CH_CONFIG)

    last_synced_id = get_last_synced_id(ch_client)
    if last_synced_id is not None:
        print(f"Last synced order_item_id: {last_synced_id}. Pulling new rows only.")
    else:
        print("No prior data found. Performing full extraction.")

    columns, rows = extract(last_synced_id)

    if not rows:
        print("No new rows to sync. Nothing inserted.")
    else:
        records = transform(columns, rows)
        load(ch_client, records)
        print("Sync complete.")

    print(f"\n=== Extraction completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
