import importlib
import sys
import unittest
from unittest.mock import patch
import builtins


class AIIntegrationImportTests(unittest.TestCase):
    def test_import_does_not_require_groq(self):
        sys.modules.pop("api.services.ai_integration", None)
        real_import = builtins.__import__

        def fake_import(name, *args, **kwargs):
            if name == "groq":
                raise ImportError("No module named groq")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=fake_import):
            module = importlib.import_module("api.services.ai_integration")

        self.assertEqual(module.generate_insight({"x": 1}, "trend"), "Insight unavailable right now.")


if __name__ == "__main__":
    unittest.main()
