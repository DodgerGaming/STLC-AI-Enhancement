"""
Analytics query service — reads aggregated sales data from ClickHouse.

Mirrors the pattern used in services/db_queries.py (raw queries, returns
plain dicts/lists ready for DRF's Response()), but connects to ClickHouse
instead of Django's ORM/SQLite, since analytics data lives in the
ClickHouse warehouse populated by the separate ETL pipeline (scripts/extraction.py).
"""

import os
import clickhouse_connect
import pandas as pd

CH_CONFIG = {
    "host": os.environ.get("CH_HOST"),
    "port": int(os.environ.get("CH_PORT", 8123)),
    "username": os.environ.get("CH_USER"),
    "password": os.environ.get("CH_PASSWORD", ""),
}

TABLE_NAME = "order_items_flat"


def get_client():
    return clickhouse_connect.get_client(**CH_CONFIG)


def _df_to_records(df):
    """Convert a DataFrame to plain JSON-safe dicts (handles Decimal/NaN)."""
    df = df.astype(object).where(pd.notnull(df), None)
    return df.to_dict(orient="records")


def get_best_selling_materials_raw(days=None):
    client = get_client()
    where_clause = f"WHERE created_at >= now() - INTERVAL {int(days)} DAY" if days else ""
    query = f"""
        SELECT
            material_name,
            SUM(qty) AS total_qty,
            SUM(qty * unit_price) AS total_revenue
        FROM {TABLE_NAME}
        {where_clause}
        GROUP BY material_name
        ORDER BY total_qty DESC
    """
    result = client.query(query)
    df = pd.DataFrame(result.result_rows, columns=result.column_names)
    return _df_to_records(df)


def get_peak_day_of_week_raw():
    client = get_client()
    query = f"""
        SELECT
            toDayOfWeek(created_at) AS day_of_week,
            SUM(qty) AS total_qty
        FROM {TABLE_NAME}
        GROUP BY day_of_week
        ORDER BY total_qty DESC
    """
    result = client.query(query)
    df = pd.DataFrame(result.result_rows, columns=result.column_names)

    day_names = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
                 5: "Friday", 6: "Saturday", 7: "Sunday"}
    df["day_name"] = df["day_of_week"].map(day_names)
    return _df_to_records(df)


def get_peak_hour_of_day_raw():
    client = get_client()
    query = f"""
        SELECT
            toHour(created_at) AS hour_of_day,
            SUM(qty) AS total_qty
        FROM {TABLE_NAME}
        GROUP BY hour_of_day
        ORDER BY total_qty DESC
    """
    result = client.query(query)
    df = pd.DataFrame(result.result_rows, columns=result.column_names)
    return _df_to_records(df)


def get_daily_sales_trend_raw():
    client = get_client()
    query = f"""
        SELECT
            toDate(created_at) AS sale_date,
            SUM(qty) AS total_qty,
            SUM(qty * unit_price) AS total_revenue
        FROM {TABLE_NAME}
        GROUP BY sale_date
        ORDER BY sale_date ASC
    """
    result = client.query(query)
    df = pd.DataFrame(result.result_rows, columns=result.column_names)

    df["revenue_change_pct"] = (df["total_revenue"].astype(float).pct_change() * 100).round(2)
    df["qty_change_pct"] = (df["total_qty"].astype(float).pct_change() * 100).round(2)

    # sale_date is a datetime.date object — convert to string for JSON safety
    df["sale_date"] = df["sale_date"].astype(str)

    return _df_to_records(df)