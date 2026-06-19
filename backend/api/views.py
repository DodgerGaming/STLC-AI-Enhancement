from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Material, Batch, Order, AuditTrail
from .serializers import MaterialSerializer, OrderSerializer, AuditTrailSerializer
from .services.db_queries import get_materials_raw, get_batches_for_material_raw
from .services.audit_log import log_audit


@api_view(['GET'])
def ping(request):
    return Response({'pong': True, 'message': 'Cutwise IMS API is up'})


@api_view(['GET'])
def material_list(request):
    try:
        materials = get_materials_raw()
        return Response(materials)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def material_detail(request, material_id):
    material = get_object_or_404(Material, material_id=material_id)
    serializer = MaterialSerializer(material)
    return Response(serializer.data)


@api_view(['GET'])
def material_batches(request, material_id):
    try:
        batches = get_batches_for_material_raw(material_id)
        return Response(batches)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_batch(request):
    """Create a new batch and associated material if needed."""
    try:
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
                'sku': data.get('sku', batch_code),
                'sale_price': data.get('sale_price', 0),
                'unit_price': data.get('unit_price', 0),
                'unit': data.get('unit', 'sqft'),
                'description': data.get('description', ''),
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
                'quality_grade': data.get('quality_grade', ''),
                'added': 'Just now',
            }
        )
        
        # Log audit trail
        log_audit(
            entity_type='Batch',
            entity_id=batch_code,
            action='CREATE',
            user=request.user.username if request.user.is_authenticated else 'Clerk',
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


@api_view(['POST'])
def create_order(request):
    serializer = OrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order = serializer.save()
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def order_list(request):
    orders = Order.objects.order_by('-created_at')[:20]
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def audit_trail_list(request):
    """Fetch audit trail entries with optional filtering."""
    entity_type = request.query_params.get('entity_type')
    entity_id = request.query_params.get('entity_id')
    limit = request.query_params.get('limit', 100)
    
    try:
        limit = int(limit)
    except (ValueError, TypeError):
        limit = 100
    
    queryset = AuditTrail.objects.all()
    
    if entity_type:
        queryset = queryset.filter(entity_type=entity_type)
    if entity_id:
        queryset = queryset.filter(entity_id=entity_id)
    
    audit_entries = queryset[:limit]
    serializer = AuditTrailSerializer(audit_entries, many=True)
    return Response(serializer.data)

