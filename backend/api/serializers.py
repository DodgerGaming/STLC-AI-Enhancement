import random
import string
from rest_framework import serializers
from .models import Batch, Material, Order, OrderItem, AuditTrail


def generate_order_id():
    token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f'CW-{random.randint(7000, 9999)}-{token}'


class BatchSerializer(serializers.ModelSerializer):
    material_id = serializers.CharField(source='material.material_id', read_only=True)

    class Meta:
        model = Batch
        fields = [
            'batch_code',
            'material_id',
            'size_sqft',
            'quantity',
            'sale_price',
            'unit_price',
            'company',
            'status',
            'added_at',
        ]


class MaterialSerializer(serializers.ModelSerializer):
    totalStock = serializers.DecimalField(source='total_stock', max_digits=12, decimal_places=2, read_only=True)
    batchCount = serializers.IntegerField(source='batch_count', read_only=True)

    class Meta:
        model = Material
        fields = [
            'material_id',
            'material_name',
            'leather_type',
            'sale_price',
            'unit_price',
            'unit',
            'description',
            'totalStock',
            'batchCount',
            'tag',
        ]


class AuditTrailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditTrail
        fields = [
            'id',
            'timestamp',
            'user',
            'entity_type',
            'entity_id',
            'entity_name',
            'action',
            'field_name',
            'old_value',
            'new_value',
            'description',
        ]
        read_only_fields = ['id', 'timestamp']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'material_name',
            'batch_code',
            'unit',
            'unit_price',
            'qty',
            'size_sqft',
            'custom_size',
            'color',
        ]
    
    def validate(self, data):
        # Ensure required fields are present
        required_fields = ['material_name', 'batch_code', 'unit', 'unit_price', 'qty', 'size_sqft']
        for field in required_fields:
            if field not in data or data[field] is None:
                raise serializers.ValidationError(f"Field '{field}' is required.")
        return data


class OrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'order_id',
            'customer',
            'fulfillment',
            'delivery_address',
            'order_description',
            'scheduled_date',
            'scheduled_time',
            'payment_method',
            'total',
            'item_count',
            'status',
            'created_at',
            'items',
        ]
        read_only_fields = ['order_id', 'status', 'created_at', 'total', 'item_count']

    def validate(self, data):
        items = data.get('items', [])
        
        # Ensure items list is not empty
        if not items:
            raise serializers.ValidationError({'items': 'At least one item is required.'})
        
        total = sum((item.get('unit_price', 0) or 0) * (item.get('qty', 0) or 0) for item in items)
        cutting_fee = sum(50 for item in items if item.get('custom_size'))
        if data.get('fulfillment') == 'Delivery':
            total += 250
        total += cutting_fee
        data['item_count'] = sum((item.get('qty', 0) or 0) for item in items)
        data['total'] = total
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not validated_data.get('order_id'):
            validated_data['order_id'] = generate_order_id()
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order