import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_framework.settings")

import django

sys.modules.setdefault("clickhouse_connect", SimpleNamespace(get_client=lambda **_: None))

django.setup()

from api.services import analytics_queries


class DailySalesTrendFallbackTests(unittest.TestCase):
    @patch("api.services.analytics_queries.get_client")
    def test_daily_sales_trend_handles_empty_clickhouse_result(self, get_client):
        get_client.return_value = SimpleNamespace(
            query=lambda query: SimpleNamespace(result_rows=[], column_names=[])
        )

        mock_manager = Mock()
        mock_manager.select_related.return_value.values_list.return_value = []

        with patch("api.models.OrderItem.objects", mock_manager):
            result = analytics_queries.get_daily_sales_trend_raw()

        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
