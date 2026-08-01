import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_framework.settings')
import django
django.setup()

from api.authentication.models import AuthUser
from django.contrib.auth.hashers import make_password

users = [
    {
        'employee_id': 'EMP001',
        'username': 'clerk',
        'email': 'Clerk@otto.com',
        'password': 'password123!',
        'first_name': 'Clerk',
        'last_name': 'Otto',
        'role': 'Clerk',
    },
    {
        'employee_id': 'EMP002',
        'username': 'admin',
        'email': 'admin@otto.com',
        'password': 'password123!',
        'first_name': 'Admin',
        'last_name': 'Otto',
        'role': 'Admin',
    }
]

for u in users:
    obj, created = AuthUser.objects.get_or_create(employee_id=u['employee_id'], defaults={
        'username': u['username'],
        'email': u['email'],
        'password': make_password(u['password']),
        'first_name': u.get('first_name',''),
        'middle_name': u.get('middle_name',''),
        'last_name': u.get('last_name',''),
        'suffix': u.get('suffix',''),
        'role': u.get('role','Clerk'),
        'is_active': True,
    })
    if not created:
        obj.username = u['username']
        obj.email = u['email']
        obj.password = make_password(u['password'])
        obj.first_name = u.get('first_name','')
        obj.middle_name = u.get('middle_name','')
        obj.last_name = u.get('last_name','')
        obj.suffix = u.get('suffix','')
        obj.role = u.get('role','Clerk')
        obj.is_active = True
        obj.save()
    print(f"Created/Updated {obj.username} ({obj.email})")

print('Seeding complete.')
