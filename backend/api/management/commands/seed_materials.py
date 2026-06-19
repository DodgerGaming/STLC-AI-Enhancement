from django.core.management.base import BaseCommand
from api.models import Material, Batch
from api.data.mock_leather import hideBatches, materials


class Command(BaseCommand):
    help = 'Seed the Material and Batch tables from mockLeather data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding materials and batches...')

        Material.objects.all().delete()
        Batch.objects.all().delete()

        material_map = {}
        for material in materials:
            material_obj = Material.objects.create(
                material_id=material['material_id'],
                material_name=material['material_name'],
                leather_type=material['leather_type'],
                sku=material['sku'],
                sale_price=material['sale_price'],
                unit_price=material['unit_price'],
                unit=material['unit'],
                total_stock=material['totalStock'],
                batch_count=material['batchCount'],
                tag=material.get('tag') or '',
                tint=material.get('tint') or '',
                swatches=material.get('swatches') or [],
                description=material.get('description') or '',
            )
            material_map[material['material_name']] = material_obj

        for batch in hideBatches:
            material_name = batch['material_name']
            if material_name not in material_map:
                self.stdout.write(self.style.WARNING(f'Skipping batch for unknown material: {material_name}'))
                continue

            Batch.objects.create(
                batch_code=batch['batch_code'],
                material=material_map[material_name],
                size_sqft=batch['size_sqft'],
                quantity=batch['quantity'],
                sale_price=batch['sale_price'],
                unit_price=batch['unit_price'],
                company=batch['company'],
                status=batch['status'],
                quality_grade=batch.get('quality_grade', ''),
                added=batch.get('added', ''),
            )

        self.stdout.write(self.style.SUCCESS('Materials and batches seeded successfully.'))
