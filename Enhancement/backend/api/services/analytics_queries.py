"""
Analytics query service — reads aggregated sales data from ClickHouse.

Mirrors the pattern used in services/db_queries.py (raw queries, returns
plain dicts/lists ready for DRF's Response()), but connects to ClickHouse
instead of Django's ORM/SQLite, since analytics data lives in the
ClickHouse warehouse populated by the separate ETL pipeline (scripts/extraction.py).
"""

import logging
import os
import time
from types import SimpleNamespace

try:
    import clickhouse_connect
except ImportError:
    clickhouse_connect = None

import pandas
from django.db.models import Sum, F

logger = logging.getLogger(__name__)

CH_CONFIG = {
    "host": os.environ.get("CH_HOST"),
    "port": int(os.environ.get("CH_PORT", 8123)),
    "username": os.environ.get("CH_USER"),
    "password": os.environ.get("CH_PASSWORD", ""),
}

TABLE_NAME = "order_items_flat"


def get_client():
    if clickhouse_connect is None:
        raise RuntimeError("clickhouse_connect is not installed")
    return clickhouse_connect.get_client(**CH_CONFIG)


def _query_clickhouse(query):
    try:
        client = get_client()
        return client.query(query)
    except Exception as exc:
        logger.exception("ClickHouse query failed: %s", exc)
        return SimpleNamespace(result_rows=[], column_names=[])


def _df_to_records(df):
    """Convert a DataFrame to plain JSON-safe dicts (handles Decimal/NaN)."""
    df = df.astype(object).where(pandas.notnull(df), None)
    return df.to_dict(orient="records")


def get_best_selling_materials_raw(days=None):
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
    result = _query_clickhouse(query)
    if not result.result_rows:
        from api.models import OrderItem

        qs = (
            OrderItem.objects.values('material_name')
            .annotate(total_qty=Sum('qty'), total_revenue=Sum(F('qty') * F('unit_price')))
            .order_by('-total_qty')
        )
        return [
            {
                'material_name': r['material_name'],
                'total_qty': float(r['total_qty'] or 0),
                'total_revenue': float(r['total_revenue'] or 0),
            }
            for r in qs
        ]

    df = pandas.DataFrame(result.result_rows, columns=result.column_names)
    df.columns = [col.lower() for col in df.columns]
    return _df_to_records(df)


def get_peak_day_of_week_raw():
    query = f"""
        SELECT
            toDayOfWeek(created_at) AS day_of_week,
            SUM(qty) AS total_qty
        FROM {TABLE_NAME}
        GROUP BY day_of_week
        ORDER BY total_qty DESC
    """
    result = _query_clickhouse(query)
    if not result.result_rows:
        from collections import Counter
        from api.models import OrderItem

        rows = OrderItem.objects.select_related('order').values_list('order__created_at', 'qty')
        counts = Counter()
        for created_at, qty in rows:
            if not created_at:
                continue
            dow = created_at.isoweekday()  # 1=Monday
            counts[dow] += int(qty or 0)

        ordered = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        day_names = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday'}
        return [{'day_of_week': k, 'total_qty': v, 'day_name': day_names.get(k)} for k, v in ordered]

    df = pandas.DataFrame(result.result_rows, columns=result.column_names)
    df.columns = [col.lower() for col in df.columns]

    day_names = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
                 5: "Friday", 6: "Saturday", 7: "Sunday"}
    if "day_of_week" not in df.columns:
        raise KeyError("day_of_week column missing from ClickHouse result")
    df["day_name"] = df["day_of_week"].map(day_names)
    return _df_to_records(df)


def get_peak_hour_of_day_raw():
    query = f"""
        SELECT
            toHour(created_at) AS hour_of_day,
            SUM(qty) AS total_qty
        FROM {TABLE_NAME}
        GROUP BY hour_of_day
        ORDER BY total_qty DESC
    """
    result = _query_clickhouse(query)
    if not result.result_rows:
        from collections import Counter
        from api.models import OrderItem

        rows = OrderItem.objects.select_related('order').values_list('order__created_at', 'qty')
        counts = Counter()
        for created_at, qty in rows:
            if not created_at:
                continue
            hour = created_at.hour
            counts[hour] += int(qty or 0)

        ordered = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        return [{'hour_of_day': h, 'total_qty': q} for h, q in ordered]

    df = pandas.DataFrame(result.result_rows, columns=result.column_names)
    df.columns = [col.lower() for col in df.columns]
    return _df_to_records(df)


def get_daily_sales_trend_raw():
    query = f"""
        SELECT
            toDate(created_at) AS sale_date,
            SUM(qty) AS total_qty,
            SUM(qty * unit_price) AS total_revenue
        FROM {TABLE_NAME}
        GROUP BY sale_date
        ORDER BY sale_date ASC
    """
    result = _query_clickhouse(query)
    if not result.result_rows:
        from collections import defaultdict
        from api.models import OrderItem
        rows = OrderItem.objects.select_related('order').values_list('order__created_at', 'qty', 'unit_price')
        agg = defaultdict(lambda: {'total_qty': 0, 'total_revenue': 0.0})
        for created_at, qty, unit_price in rows:
            if not created_at:
                continue
            day = created_at.date().isoformat()
            agg[day]['total_qty'] += int(qty or 0)
            agg[day]['total_revenue'] += float((qty or 0) * float(unit_price or 0))

        items = sorted([(d, v['total_qty'], v['total_revenue']) for d, v in agg.items()], key=lambda x: x[0])
        df = pandas.DataFrame([{'sale_date': d, 'total_qty': q, 'total_revenue': r} for d, q, r in items])
        if df.empty:
            return []
        df['revenue_change_pct'] = (df['total_revenue'].astype(float).pct_change() * 100).round(2)
        df['qty_change_pct'] = (df['total_qty'].astype(float).pct_change() * 100).round(2)
        df['sale_date'] = df['sale_date'].astype(str)
        return _df_to_records(df)

    df = pandas.DataFrame(result.result_rows, columns=result.column_names)
    df.columns = [col.lower() for col in df.columns]

    if "total_revenue" not in df.columns:
        raise KeyError("total_revenue column missing from ClickHouse result")

    df["revenue_change_pct"] = (df["total_revenue"].astype(float).pct_change() * 100).round(2)
    df["qty_change_pct"] = (df["total_qty"].astype(float).pct_change() * 100).round(2)

    df["sale_date"] = df["sale_date"].astype(str)
    return _df_to_records(df)


def get_analytics_summary():
    """
    Runs all four analytics queries once and prints a single combined
    summary (total duration + total records), similar to the OpenSIS
    sample's one-line 'Duration / Output' format per pipeline step.
    """
    start = time.time()

    best_sellers = get_best_selling_materials_raw()
    peak_day = get_peak_day_of_week_raw()
    peak_hour = get_peak_hour_of_day_raw()
    trend = get_daily_sales_trend_raw()

    duration = time.time() - start
    total_records = len(best_sellers) + len(peak_day) + len(peak_hour) + len(trend)

    print(f"[Analytics Summary] duration={duration:.2f}s total_records={total_records}")
    print(f"  best_sellers={len(best_sellers)} peak_day={len(peak_day)} "
          f"peak_hour={len(peak_hour)} trend={len(trend)}")

    return {
        "duration_seconds": round(duration, 2),
        "total_records": total_records,
        "best_sellers": best_sellers,
        "peak_day": peak_day,
        "peak_hour": peak_hour,
        "trend": trend,
    }