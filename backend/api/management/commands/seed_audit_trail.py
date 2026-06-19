from django.core.management.base import BaseCommand
from api.models import Material, AuditTrail
from api.services.audit_log import log_audit


class Command(BaseCommand):
    help = 'Create sample audit trail entries for demonstration'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample audit trail entries...')

        # Clear existing audit entries
        AuditTrail.objects.all().delete()

        # Create sample CREATE entries
        log_audit(
            entity_type='Material',
            entity_id='full-grain-cow-nappa',
            entity_name='Full Grain Cow Nappa (Cowhide)',
            action='CREATE',
            new_instance={
                'material_id': 'full-grain-cow-nappa',
                'material_name': 'Full Grain Cow Nappa',
                'leather_type': 'Cowhide',
                'sku': 'CH-2024-BR',
                'sale_price': 285,
                'unit_price': 178,
                'unit': 'sqft',
                'total_stock': 420.7,
                'batch_count': 3,
                'tag': 'Best Seller',
                'tint': '#8B4A2E',
            },
            user='Admin',
            description='Material added to inventory'
        )

        # Create sample UPDATE entries (excluding status field)
        log_audit(
            entity_type='Material',
            entity_id='full-grain-cow-nappa',
            entity_name='Full Grain Cow Nappa (Cowhide)',
            action='UPDATE',
            old_instance={
                'sale_price': 285,
                'unit_price': 178,
                'total_stock': 420.7,
            },
            new_instance={
                'sale_price': 295,
                'unit_price': 180,
                'total_stock': 420.7,
            },
            user='SalesClerk',
            description='Price adjustment'
        )

        # Create sample Batch entries
        log_audit(
            entity_type='Batch',
            entity_id='CH-2024-BR-A',
            entity_name='Full Grain Cow Nappa (CH-2024-BR-A)',
            action='CREATE',
            new_instance={
                'batch_code': 'CH-2024-BR-A',
                'material_id': 'full-grain-cow-nappa',
                'size_sqft': 142.0,
                'quantity': 1,
                'sale_price': 285,
                'unit_price': 178,
                'company': 'Tannería del Sol',
                'quality_grade': 'Grade A',
            },
            user='Admin',
            description='New batch created'
        )

        # Example DELETE entry - shows entity_name for clarity
        log_audit(
            entity_type='Batch',
            entity_id='CH-2024-BR-OLD',
            entity_name='Tan Pebble Grain (CH-2024-BR-OLD)',
            action='DELETE',
            old_instance={
                'batch_code': 'CH-2024-BR-OLD',
                'size_sqft': 120.0,
                'quantity': 1,
                'sale_price': 315,
                'unit_price': 205,
                'company': 'Cebu Hide Co.',
                'quality_grade': 'Grade A',
            },
            user='Admin',
            description='Damaged batch removed from inventory'
        )

        # Note: status field changes are NOT tracked
        log_audit(
            entity_type='Batch',
            entity_id='CH-2024-BR-A',
            entity_name='Full Grain Cow Nappa (CH-2024-BR-A)',
            action='UPDATE',
            old_instance={
                'size_sqft': 142.0,
                'quantity': 1,
                'status': 'Available',  # This will NOT be tracked
            },
            new_instance={
                'size_sqft': 142.0,
                'quantity': 1,
                'status': 'Reserved',  # This will NOT be tracked
            },
            user='SalesClerk',
            description='Batch status changed (not tracked in audit)'
        )

        self.stdout.write(self.style.SUCCESS('Sample audit trail entries created successfully.'))
