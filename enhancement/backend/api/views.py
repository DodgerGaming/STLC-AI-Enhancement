from django.db import transaction
from django.db.models import F, Sum, Value, DecimalField
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
import logging

logger = logging.getLogger(__name__)

from .models import Material, Batch, Order, AuditTrail
from .serializers import MaterialSerializer, OrderSerializer, AuditTrailSerializer
from .services.db_queries import (
    get_materials_raw,
    get_batches_for_material_raw,
    get_material_detail_raw,
)

from .services.analytics_queries import (
    get_best_selling_materials_raw,
    get_peak_day_of_week_raw,
    get_peak_hour_of_day_raw,
    get_daily_sales_trend_raw,
)

from .audit import log_audit
from .services.ai_integration import generate_insight


def get_request_user(request):
    """
    Resolve the acting user as the custom AuthUser instance so it can be stored on
    the AuditTrail user FK. Falls back to request.user if it is already AuthUser.
    """
    from api.authentication.models import AuthUser

    user_header = request.headers.get('X-User-Email') or request.headers.get('X-User-Name')
    if user_header:
        user = AuthUser.objects.filter(email__iexact=user_header).first()
        if user:
            return user
        return AuthUser.objects.filter(username__iexact=user_header).first()

    if hasattr(request, 'user') and request.user.is_authenticated:
        return request.user

    return None


def refresh_material_aggregates(material):
    totals = Batch.objects.filter(material=material).aggregate(
        total=Coalesce(
            Sum(F('size_sqft') * F('quantity')),
            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
        ),
    )
    material.total_stock = totals.get('total') or 0
    material.batch_count = Batch.objects.filter(material=material).count()
    material.save(update_fields=['total_stock', 'batch_count'])


@api_view(['GET'])
def ping(request):
    return Response({'pong': True, 'message': 'Cutwise IMS API is up'})


def favicon(request):
        svg = """
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
            <rect width='100' height='100' rx='20' fill='#8B2525'/>
            <text x='50' y='66' font-size='52' font-family='Arial' font-weight='800' fill='#FAF8F5' text-anchor='middle'>C</text>
        </svg>
        """
        return HttpResponse(svg, content_type='image/svg+xml')


@api_view(['GET'])
def material_list(request):
    try:
        q = request.query_params.get('q')
        t = request.query_params.get('type')
        materials = get_materials_raw(search=q, leather_type=t)
        return Response(materials)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def material_detail(request, material_id):
    try:
        detail = get_material_detail_raw(material_id)
        if detail is None:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(detail)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def material_batches(request, material_id):
    try:
        batches = get_batches_for_material_raw(material_id)
        return Response(batches)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def create_batch(request):
    """Create a new batch (POST) or list recent batches (GET)."""
    if request.method == 'GET':
        # return recent batches
        limit = request.query_params.get('limit', 100)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 100

        batches = Batch.objects.select_related('material').order_by('-added_at')[:limit]
        results = []
        for b in batches:
            results.append({
                'batch_code': b.batch_code,
                'material_id': b.material.material_id,
                'material_name': b.material.material_name,
                'leather_type': b.material.leather_type,
                'tag': b.material.tag,
                'description': b.material.description,
                'size_sqft': float(b.size_sqft),
                'quantity': float(b.quantity),
                'sale_price': float(b.sale_price),
                'unit_price': float(b.unit_price),
                'company': b.company,
                'status': b.status,
                'added_at': b.added_at.isoformat(),
            })
        return Response(results)

    try:
        request_user = get_request_user(request)
        if not request_user or request_user.role != 'Supervisor':
            return Response(
                {'detail': 'Only Supervisors can create new batches.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        material_name = data.get('material_name', '').strip()
        batch_code = data.get('batch_code', '').strip()

        if not material_name or not batch_code:
            return Response(
                {'detail': 'material_name and batch_code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate material_id from material name
        material_id = slugify(material_name)

        # Get or create material
        material, created = Material.objects.get_or_create(
            material_id=material_id,
            defaults={
                'material_name': material_name,
                'leather_type': data.get('leather_type', 'Cowhide'),
                'sale_price': data.get('sale_price', 0),
                'unit_price': data.get('unit_price', 0),
                'unit': data.get('unit', 'sqft'),
                'description': data.get('description', ''),
                'tag': data.get('tag', ''),
            }
        )

        # Create batch
        batch, batch_created = Batch.objects.get_or_create(
            batch_code=batch_code,
            defaults={
                'material': material,
                'size_sqft': data.get('size_sqft', 0),
                'quantity': data.get('quantity', 1),
                'sale_price': data.get('sale_price', 0),
                'unit_price': data.get('unit_price', 0),
                'company': data.get('company', ''),
                'status': data.get('status', 'Available'),
            }
        )

        if batch_created:
            refresh_material_aggregates(material)

            new_instance = {
                'batch_code': batch.batch_code,
                'material_id': material.material_id,
                'material_name': material.material_name,
                'leather_type': material.leather_type,
                'tag': material.tag,
                'description': material.description,
                'size_sqft': float(batch.size_sqft),
                'quantity': float(batch.quantity),
                'sale_price': float(batch.sale_price),
                'unit_price': float(batch.unit_price),
                'company': batch.company,
                'status': batch.status,
            }

            # Log audit trail
            log_audit(
                entity_type='Batch',
                entity_id=batch_code,
                action='CREATE',
                new_instance=new_instance,
                user=get_request_user(request),
                description=f'Created batch {batch_code} for {material_name}',
                entity_name=material_name
            )

        return Response(
            {
                'batch_code': batch.batch_code,
                'material_id': material.material_id,
                'material_name': material.material_name,
                'status': batch.status,
                'message': 'Batch created successfully'
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
def batch_detail(request, batch_code):
    try:
        batch = get_object_or_404(Batch.objects.select_related('material'), batch_code=batch_code)

        if request.method == 'GET':
            return Response({
                'batch_code': batch.batch_code,
                'material_id': batch.material.material_id,
                'material_name': batch.material.material_name,
                'leather_type': batch.material.leather_type,
                'tag': batch.material.tag,
                'description': batch.material.description,
                'size_sqft': float(batch.size_sqft),
                'quantity': float(batch.quantity),
                'sale_price': float(batch.sale_price),
                'unit_price': float(batch.unit_price),
                'company': batch.company,
                'status': batch.status,
                'added_at': batch.added_at.isoformat(),
            })

        if request.method == 'PATCH':
            data = request.data
            old_instance = {
                'material_name': batch.material.material_name,
                'leather_type': batch.material.leather_type,
                'tag': batch.material.tag,
                'description': batch.material.description,
                'sale_price': float(batch.sale_price),
                'unit_price': float(batch.unit_price),
                'size_sqft': float(batch.size_sqft),
                'quantity': float(batch.quantity),
                'company': batch.company,
                'status': batch.status,
            }

            material_name = data.get('material_name')
            leather_type = data.get('leather_type')
            tag = data.get('tag')
            description = data.get('description')
            sale_price = data.get('sale_price')
            unit_price = data.get('unit_price')

            if material_name is not None:
                batch.material.material_name = material_name.strip()
            if leather_type is not None:
                batch.material.leather_type = leather_type
            if tag is not None:
                batch.material.tag = tag
            if description is not None:
                batch.material.description = description.strip()
            if sale_price is not None:
                batch.sale_price = sale_price
            if unit_price is not None:
                batch.unit_price = unit_price
            batch.size_sqft = data.get('size_sqft', batch.size_sqft)
            batch.quantity = data.get('quantity', batch.quantity)
            batch.company = data.get('company', batch.company)
            batch.status = data.get('status', batch.status)

            batch.material.save()
            batch.save()
            refresh_material_aggregates(batch.material)

            new_instance = {
                'material_name': batch.material.material_name,
                'leather_type': batch.material.leather_type,
                'tag': batch.material.tag,
                'description': batch.material.description,
                'sale_price': float(batch.sale_price),
                'unit_price': float(batch.unit_price),
                'size_sqft': float(batch.size_sqft),
                'quantity': float(batch.quantity),
                'company': batch.company,
                'status': batch.status,
            }

            log_audit(
                entity_type='Batch',
                entity_id=batch_code,
                action='UPDATE',
                old_instance=old_instance,
                new_instance=new_instance,
                user=get_request_user(request),
                description=f'Updated batch {batch_code}',
                entity_name=batch.material.material_name,
            )

            return Response({'message': 'Batch updated successfully'})

        if request.method == 'DELETE':
            material = batch.material
            old_instance = {
                'material_name': batch.material.material_name,
                'leather_type': batch.material.leather_type,
                'tag': batch.material.tag,
                'description': batch.material.description,
                'sale_price': float(batch.sale_price),
                'unit_price': float(batch.unit_price),
                'size_sqft': float(batch.size_sqft),
                'quantity': float(batch.quantity),
                'company': batch.company,
                'status': batch.status,
            }
            batch.delete()
            refresh_material_aggregates(material)
            log_audit(
                entity_type='Batch',
                entity_id=batch_code,
                action='DELETE',
                old_instance=old_instance,
                user=get_request_user(request),
                description=f'Deleted batch {batch_code}',
                entity_name=material.material_name,
            )
            return Response({'message': 'Batch deleted successfully'})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def orders(request):
    """Handle GET (list orders) and POST (create order)."""
    if request.method == 'GET':
        orders = Order.objects.order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    
    # POST: create order
    logger.info(f"Order creation request data: {request.data}")
    serializer = OrderSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        logger.error(f"Order validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # Store items before save() (create() will pop them from validated_data)
            items_data = list(serializer.validated_data.get('items', []))
            order = serializer.save()
            batches_to_refresh = set()
            for item in items_data:
                batch_code = item.get('batch_code')
                order_qty = item.get('qty') or 0
                batch = get_object_or_404(Batch.objects.select_related('material'), batch_code=batch_code)

                if order_qty > batch.quantity:
                    return Response(
                        {'detail': f'Insufficient quantity for batch {batch_code}. Requested {order_qty}, available {batch.quantity}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                batch.quantity = batch.quantity - order_qty
                if batch.quantity <= 0:
                    batch.quantity = 0
                    batch.status = 'Out of Stock'
                batch.save(update_fields=['quantity', 'status'])
                batches_to_refresh.add(batch.material.material_id)

            for material_id in batches_to_refresh:
                material = Material.objects.get(material_id=material_id)
                refresh_material_aggregates(material)

    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    log_audit(
        entity_type='Order',
        entity_id=order.order_id,
        action='CREATE',
        new_instance={
            'order_id': order.order_id,
            'customer': order.customer,
            'fulfillment': order.fulfillment,
            'delivery_address': order.delivery_address,
            'order_description': order.order_description,
            'scheduled_date': order.scheduled_date,
            'scheduled_time': order.scheduled_time,
            'payment_method': order.payment_method,
            'total': order.total,
            'item_count': order.item_count,
            'status': order.status,
        },
        user=get_request_user(request),
        description=f'Created sales order {order.order_id}',
        entity_name=order.customer,
    )

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def order_detail(request, order_id):
    """Delete an order and its related order items."""
    try:
        order = get_object_or_404(Order, order_id=order_id)
        old_instance = {
            'order_id': order.order_id,
            'customer': order.customer,
            'fulfillment': order.fulfillment,
            'delivery_address': order.delivery_address,
            'order_description': order.order_description,
            'scheduled_date': order.scheduled_date.isoformat() if order.scheduled_date else None,
            'scheduled_time': order.scheduled_time.isoformat() if order.scheduled_time else None,
            'payment_method': order.payment_method,
            'total': float(order.total),
            'item_count': order.item_count,
            'status': order.status,
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': [
                {
                    'material_name': item.material_name,
                    'batch_code': item.batch_code,
                    'unit': item.unit,
                    'unit_price': float(item.unit_price),
                    'qty': item.qty,
                    'size_sqft': float(item.size_sqft),
                    'custom_size': item.custom_size,
                    'color': item.color,
                }
                for item in order.items.all()
            ],
        }

        order.delete()

        log_audit(
            entity_type='Order',
            entity_id=order_id,
            action='DELETE',
            old_instance=old_instance,
            user=get_request_user(request),
            description=f'Deleted order {order_id}',
            entity_name=order.customer,
        )
        return Response({'message': 'Order deleted successfully'})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def audit_trail_list(request):
    """Fetch audit trail entries with optional filtering."""
    entity_type = request.query_params.get('entity_type')
    entity_id = request.query_params.get('entity_id')
    action = request.query_params.get('action')
    role = request.query_params.get('role')
    limit = request.query_params.get('limit', 100)

    try:
        limit = int(limit)
    except (ValueError, TypeError):
        limit = 100

    queryset = AuditTrail.objects.select_related('user').all()

    if entity_type:
        queryset = queryset.filter(entity_type=entity_type)
    if entity_id:
        queryset = queryset.filter(entity_id=entity_id)
    if action and action.upper() != 'ALL':
        queryset = queryset.filter(action=action.upper())

    # Fetch from DB first (only applying entity-level filters).
    # Cannot filter by role in queryset since role is a @property on AuditTrail
    # (computed in Python, not a DB column).
    audit_entries = list(queryset[:limit])

    # Apply role filter in Python using the @property
    if role and role.lower() != 'all':
        audit_entries = [
            e for e in audit_entries
            if (e.role or '').lower() == role.lower()
        ]

    serializer = AuditTrailSerializer(audit_entries, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def best_selling_materials(request):
    try:
        days = request.query_params.get('days')
        days = int(days) if days else None
        data = get_best_selling_materials_raw(days=days)
        insight = generate_insight(data, insight_type = best_selling_materials)
        return Response({"data": data, "insight": insight})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def peak_day_of_week(request):
    try:
        data = get_peak_day_of_week_raw()
        insight = generate_insight(data, insight_type = peak_day_of_week)
        return Response({"data": data, "insight": insight})    
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def peak_hour_of_day(request):
    try:
        data = get_peak_hour_of_day_raw()
        insight = generate_insight(data, insight_type = peak_hour_of_day)
        return Response({"data": data, "insight": insight})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def daily_sales_trend(request):
    try:
        data = get_daily_sales_trend_raw()
        insight = generate_insight(data, insight_type = daily_sales_trend)
        return Response({"data": data, "insight": insight})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)