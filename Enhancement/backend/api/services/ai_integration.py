"""
api/services/ai_insights.py

Generates short, descriptive natural-language insights from analytics data
using Groq. This is DESCRIPTIVE only (summarizes what the data shows) —
not predictive/ML.

Usage:
    from api.services.ai_insights import generate_insight
    insight_text = generate_insight(data, insight_type="best-sellers")
"""

import os
import time
import logging
from pathlib import Path
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

try:
    from groq import Groq
except ImportError:  # pragma: no cover - exercised when dependency is absent
    Groq = None

logger = logging.getLogger(__name__)

# --- Config ---------------------------------------------------------------

GROQ_MODEL = "llama-3.1-8b-instant"
MAX_INSIGHT_WORDS = 20  # hard cap communicated to the model via prompt
FALLBACK_TEXT = "Insight unavailable right now."

_client = None  # lazy-initialized so a missing key doesn't crash import


def _get_client():
    """Lazily create the Groq client so import-time doesn't require the key."""
    global _client
    if _client is None:
        if Groq is None:
            raise RuntimeError("The 'groq' package is not installed.")
        api_key = os.environ.get("GROQ_API_KEY")
        # If env var not set, try loading backend/.env (common in dev)
        if not api_key and load_dotenv is not None:
            try:
                backend_dir = Path(__file__).resolve().parents[2]
                dotenv_path = backend_dir / '.env'
                if dotenv_path.exists():
                    load_dotenv(str(dotenv_path))
                    api_key = os.environ.get("GROQ_API_KEY")
            except Exception:
                pass

        # If still not set, try reading from Django settings (if available)
        if not api_key:
            try:
                from django.conf import settings as _dj_settings

                api_key = getattr(_dj_settings, 'GROQ_API_KEY', None)
            except Exception:
                api_key = None

        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in the environment.")

        _client = Groq(api_key=api_key)
    return _client


# --- Prompt templates per insight_type -------------------------------------
# Each maps to one of the 4 existing endpoints. Keep prompts short/specific —
# the model only needs to describe, not analyze deeply.

_PROMPT_TEMPLATES = {
    "best-sellers": (
        "You are a retail analytics assistant. Given this best-sellers data "
        "(product names and quantities sold), write a concise summary of the top "
        "performer, the relative revenue contribution, and any meaningful trend. "
        "Use no more than {max_words} words. No preamble, no markdown, just the summary.\n\nData: {data}"
    ),
    "peak-day": (
        "You are a retail analytics assistant. Given this data on sales by "
        "day of week, write ONE short sentence, max {max_words} words, "
        "naming the peak day. No preamble, no markdown, just the sentence.\n\n"
        "Data: {data}"
    ),
    "peak-hour": (
        "You are a retail analytics assistant. Given this data on sales by "
        "hour of day, write ONE short sentence, max {max_words} words, "
        "naming the peak hour. No preamble, no markdown, just the sentence.\n\n"
        "Data: {data}"
    ),
    "trend": (
        "You are a retail analytics assistant. Given this sales trend data "
        "over time, write ONE short sentence, max {max_words} words, "
        "describing the overall direction (up/down/flat). No preamble, "
        "no markdown, just the sentence.\n\nData: {data}"
    ),
}

_DEFAULT_TEMPLATE = (
    "You are a retail analytics assistant. Given this data, write ONE short "
    "sentence, max {max_words} words, summarizing the key takeaway. "
    "No preamble, no markdown, just the sentence.\n\nData: {data}"
)


def generate_insight(data, insight_type: str) -> str:
    """
    Turn analytics data into a short natural-language insight using Groq.

    Args:
        data: The list/dict of analytics results (e.g. from ClickHouse query).
        insight_type: One of "best-sellers", "peak-day", "peak-hour", "trend".
                       Unrecognized types fall back to a generic prompt.

    Returns:
        A short insight string. On ANY failure (missing key, network error,
        API error, timeout), returns FALLBACK_TEXT instead of raising —
        callers should never have to handle exceptions from this function.
    """

    if not data:
        return "No data available for this period."

    try:
        client = _get_client()

        template = _PROMPT_TEMPLATES.get(insight_type, _DEFAULT_TEMPLATE)
        prompt = template.format(max_words=MAX_INSIGHT_WORDS, data=data)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=40,       # short output only — keeps latency low
            temperature=0.3,     # low temp: consistent, factual, not flowery
            timeout=8,           # fail fast rather than hang a request/demo
        )

        text = response.choices[0].message.content.strip()
        return text if text else FALLBACK_TEXT

    except Exception as e:
        # Covers: missing API key, network issues, rate limits, malformed
        # data, Groq API errors, timeouts — all degrade gracefully.
        logger.warning(f"generate_insight failed for type='{insight_type}': {e}")
        return FALLBACK_TEXT


def generate_all_insights():
    """
    Runs generate_insight() for all four analytics types using live data
    from analytics_queries.py, and prints one combined summary
    (total duration + insight count), matching the OpenSIS-style
    one-line 'Duration / Output' format per pipeline step.
    """
    from api.services.analytics_queries import (
        get_best_selling_materials_raw,
        get_peak_day_of_week_raw,
        get_peak_hour_of_day_raw,
        get_daily_sales_trend_raw,
    )

    start = time.time()

    insights = {
        "best-sellers": generate_insight(get_best_selling_materials_raw(), "best-sellers"),
        "peak-day": generate_insight(get_peak_day_of_week_raw(), "peak-day"),
        "peak-hour": generate_insight(get_peak_hour_of_day_raw(), "peak-hour"),
        "trend": generate_insight(get_daily_sales_trend_raw(), "trend"),
    }

    duration = time.time() - start
    generated_count = sum(1 for v in insights.values() if v != FALLBACK_TEXT)

    print(f"[AI Insight Summary] duration={duration:.2f}s insights_generated={generated_count}/4")
    for key, text in insights.items():
        print(f"  {key}: {text}")

    return {
        "duration_seconds": round(duration, 2),
        "insights_generated": generated_count,
        "insights": insights,
    }