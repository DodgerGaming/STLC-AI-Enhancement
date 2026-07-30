import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_framework.settings')
import django
django.setup()

from api.authentication.models import AuthUser
from api.models import AuditTrail, Batch, Material, Order, OrderItem

def print_sample(qs, name):
    try:
        count = qs.count()
    except Exception as e:
        print(f"{name}: ERROR - {e}")
        return
    print(f"\n{name} - count: {count}")
    try:
        for obj in qs.all()[:5]:
            print(obj)
    except Exception as e:
        print(f"{name}: could not iterate - {e}")

if __name__ == '__main__':
    print_sample(AuthUser.objects, 'auth_custom_user')
    print_sample(AuditTrail.objects, 'api_audittrail')
    print_sample(Batch.objects, 'api_batch')
    print_sample(Material.objects, 'api_material')
    print_sample(Order.objects, 'api_order')
    print_sample(OrderItem.objects, 'api_orderitem')
