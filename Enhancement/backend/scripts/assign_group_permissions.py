import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_framework.settings')
import django
django.setup()

from django.contrib.auth.models import Group, Permission

admin_group, _ = Group.objects.get_or_create(name='Admin')
clerk_group, _ = Group.objects.get_or_create(name='Clerk')

# Give Admin all permissions
all_perms = Permission.objects.all()
admin_group.permissions.set(all_perms)

# Clerk: pick a safe subset if available
clerk_codenames = [
    'view_order', 'add_order', 'change_order',
    'view_batch', 'add_batch',
    'view_material',
]
found_perms = Permission.objects.filter(codename__in=clerk_codenames)
clerk_group.permissions.set(found_perms)

print(f"Assigned {all_perms.count()} permissions to Admin")
print(f"Assigned {found_perms.count()} permissions to Clerk: {[p.codename for p in found_perms]}")
