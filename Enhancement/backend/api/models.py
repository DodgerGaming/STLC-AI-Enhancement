from django.conf import settings
from django.db import models


class Material(models.Model):
    material_id = models.SlugField(primary_key=True, max_length=100)
    material_name = models.CharField(max_length=255)
    leather_type = models.CharField(max_length=80)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    total_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    batch_count = models.PositiveIntegerField(default=0)
    tag = models.CharField(max_length=50, blank=True)
    # removed tint and swatches (handled in UI via design assets)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.material_name


class Batch(models.Model):
    batch_code = models.CharField(primary_key=True, max_length=50)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='batches')
    size_sqft = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    company = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    # quality_grade removed; use status to indicate availability
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.batch_code} ({self.material.material_name})'


class Order(models.Model):
    order_id = models.CharField(primary_key=True, max_length=50)
    customer = models.CharField(max_length=255)
    fulfillment = models.CharField(max_length=50)
    delivery_address = models.TextField(blank=True)
    order_description = models.TextField(blank=True)
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=50)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    item_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    material_name = models.CharField(max_length=255)
    batch_code = models.CharField(max_length=50)
    unit = models.CharField(max_length=20)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField()
    size_sqft = models.DecimalField(max_digits=12, decimal_places=2)
    custom_size = models.CharField(max_length=80, blank=True)
    color = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f'{self.order.order_id} - {self.material_name}'


class AuditTrail(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        'authentication.AuthUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_entries',
    )
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=100)
    entity_name = models.CharField(max_length=255, blank=True, help_text='Material name, leather type, or identifying info')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    @property
    def role(self):
        return self.user.role if self.user else None

    @property
    def user_display_name(self):
        if not self.user:
            return 'System'
        return getattr(self.user, 'username', None) or getattr(self.user, 'email', 'System')

    def __str__(self):
        return f'{self.action} {self.entity_type} {self.entity_id} on {self.timestamp}'