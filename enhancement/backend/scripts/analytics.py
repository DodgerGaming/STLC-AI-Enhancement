import os
import clickhouse_connect
import pandas as pd
from dotenv import load_dotenv
 
load_dotenv()
 
CH_CONFIG = {
    "host": os.getenv("CH_HOST"),
    "port": int(os.getenv("CH_PORT")),
    "username": os.getenv("CH_USER"),
    "password": os.getenv("CH_PASSWORD"),
}
 
TABLE_NAME = "order_items_flat"
 
 
def get_client():
    """Create a ClickHouse client connection."""
    return clickhouse_connect.get_client(**CH_CONFIG)
 
 
# ---------- BEST-SELLING MATERIAL ----------
def get_best_selling_materials(client, days=None):
    """
    Returns total quantity and revenue per material, sorted by quantity.
 
    Args:
        days: if provided, only include the last N days. If None, all-time.
    """
    where_clause = f"WHERE created_at >= now() - INTERVAL {days} DAY" if days else ""
 
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
    return pd.DataFrame(result.result_rows, columns=result.column_names)
 
 
# ---------- PEAK SALES PERIOD ----------
def get_peak_day_of_week(client):
    """Returns total quantity sold per day of week (1=Monday ... 7=Sunday)."""
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
    return df
 
 
def get_peak_hour_of_day(client):
    """Returns total quantity sold per hour of day (0-23)."""
    query = f"""
        SELECT
            toHour(created_at) AS hour_of_day,
            SUM(qty) AS total_qty
        FROM {TABLE_NAME}
        GROUP BY hour_of_day
        ORDER BY total_qty DESC
    """
    result = client.query(query)
    return pd.DataFrame(result.result_rows, columns=result.column_names)
 
 
# ---------- SALES TREND ----------
def get_daily_sales_trend(client):
    """
    Returns a daily time series of total quantity and revenue,
    with day-over-day percent change calculated via pandas.
    """
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
 
    # Pandas step: this is the kind of calculation SQL can't easily express
    df["revenue_change_pct"] = df["total_revenue"].pct_change() * 100
    df["qty_change_pct"] = df["total_qty"].pct_change() * 100
 
    return df
 
 
# ---------- RUN (for manual testing) ----------
if __name__ == "__main__":
    client = get_client()
 
    print("=== Best-Selling Materials ===")
    print(get_best_selling_materials(client))
 
    print("\n=== Peak Day of Week ===")
    print(get_peak_day_of_week(client))
 
    print("\n=== Peak Hour of Day ===")
    print(get_peak_hour_of_day(client))
 
    print("\n=== Daily Sales Trend ===")
    print(get_daily_sales_trend(client))