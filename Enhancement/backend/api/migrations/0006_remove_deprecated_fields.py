from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_material_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='batch',
            name='added_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.RemoveField(
            model_name='batch',
            name='quality_grade',
        ),
        migrations.RemoveField(
            model_name='batch',
            name='added',
        ),
        migrations.RemoveField(
            model_name='material',
            name='tint',
        ),
        migrations.RemoveField(
            model_name='material',
            name='swatches',
        ),
    ]
