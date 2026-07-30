import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_framework.settings')
import django
django.setup()
from django.db import connection
print('connection.settings_dict =', connection.settings_dict)
try:
    connection.ensure_connection()
    print('CONNECTED')
except Exception as e:
    print('ERROR:', type(e).__name__, e)
    sys.exit(1)
