import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_framework.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
CLERK_USERNAME = os.environ.get('CLERK_USERNAME', 'clerk')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '12345678')
CLERK_PASSWORD = os.environ.get('CLERK_PASSWORD', '12345678')

# Create groups
admin_group, _ = Group.objects.get_or_create(name='Admin')
clerk_group, _ = Group.objects.get_or_create(name='Clerk')

# Create or update admin user
admin_user, created = User.objects.get_or_create(username=ADMIN_USERNAME)
admin_user.is_active = True
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.set_password(ADMIN_PASSWORD)
admin_user.save()
admin_user.groups.add(admin_group)

# Create or update clerk user
clerk_user, created = User.objects.get_or_create(username=CLERK_USERNAME)
clerk_user.is_active = True
clerk_user.is_staff = False
clerk_user.is_superuser = False
clerk_user.set_password(CLERK_PASSWORD)
clerk_user.save()
clerk_user.groups.add(clerk_group)

print(f"Created/Updated users: {ADMIN_USERNAME}, {CLERK_USERNAME}")
print('Assigned groups: Admin, Clerk')
