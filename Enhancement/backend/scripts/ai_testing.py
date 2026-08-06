"""
ai_testing.py

Standalone test script for generate_insight() — run directly, no Django
server needed. Place this in enhancement/backend/ (same level as manage.py)
and run: python ai_testing.py

Covers all 4 insight_type values with sample data shaped like real
ClickHouse output, plus a fallback check at the end.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # points back to enhancement/backend

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from api.services.ai_integration import generate_insight

# ------------------------------------------------------------------
# Sample data shaped like real output from analytics_queries.py
# ------------------------------------------------------------------

sample_best_sellers = [
    {"material_name": "Leather", "total_qty": 120, "total_revenue": 45000},
    {"material_name": "Suede", "total_qty": 80, "total_revenue": 28000},
    {"material_name": "Canvas", "total_qty": 45, "total_revenue": 12000},
]

sample_peak_day = [
    {"day_of_week": 2, "total_qty": 340, "day_name": "Tuesday"},
    {"day_of_week": 5, "total_qty": 310, "day_name": "Friday"},
    {"day_of_week": 6, "total_qty": 290, "day_name": "Saturday"},
    {"day_of_week": 1, "total_qty": 210, "day_name": "Monday"},
]

sample_peak_hour = [
    {"hour_of_day": 14, "total_qty": 95},
    {"hour_of_day": 11, "total_qty": 88},
    {"hour_of_day": 16, "total_qty": 76},
    {"hour_of_day": 9, "total_qty": 40},
]

sample_trend = [
    {"sale_date": "2026-07-27", "total_qty": 200, "total_revenue": 60000, "revenue_change_pct": None, "qty_change_pct": None},
    {"sale_date": "2026-07-28", "total_qty": 220, "total_revenue": 66000, "revenue_change_pct": 10.0, "qty_change_pct": 10.0},
    {"sale_date": "2026-07-29", "total_qty": 250, "total_revenue": 75000, "revenue_change_pct": 13.64, "qty_change_pct": 13.64},
    {"sale_date": "2026-07-30", "total_qty": 245, "total_revenue": 73500, "revenue_change_pct": -2.0, "qty_change_pct": -2.0},
]

# ------------------------------------------------------------------
# Run through each insight_type
# ------------------------------------------------------------------

test_cases = [
    ("best-sellers", sample_best_sellers),
    ("peak-day", sample_peak_day),
    ("peak-hour", sample_peak_hour),
    ("trend", sample_trend),
]

print("=" * 60)
print("TESTING generate_insight() — all 4 insight types")
print("=" * 60)

for insight_type, data in test_cases:
    result = generate_insight(data, insight_type=insight_type)
    word_count = len(result.split())
    print(f"\n[{insight_type}]")
    print(f"  -> {result}")
    print(f"  (word count: {word_count})")

# ------------------------------------------------------------------
# Edge cases
# ------------------------------------------------------------------

print("\n" + "=" * 60)
print("EDGE CASES")
print("=" * 60)

# Empty data
empty_result = generate_insight([], insight_type="best-sellers")
print(f"\n[empty data]")
print(f"  -> {empty_result}")

# Unknown insight_type (should fall back to the generic template)
unknown_result = generate_insight(sample_trend, insight_type="forecast")
print(f"\n[unknown insight_type='forecast']")
print(f"  -> {unknown_result}")

print("\n" + "=" * 60)
print("DONE. Compare each output against its data — does it make sense?")
print("Next: deliberately break GROQ_API_KEY or set timeout=0.001 in")
print("ai_insights.py to confirm the fallback text triggers correctly.")
print("=" * 60)