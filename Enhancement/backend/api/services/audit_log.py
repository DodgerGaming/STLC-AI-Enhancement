from api.models import AuditTrail


# Fields to exclude from audit tracking
EXCLUDED_FIELDS = {'status', 'updated_at', 'created_at'}


def log_audit(entity_type, entity_id, action, old_instance=None, new_instance=None, user='System', description='', entity_name=''):
    """
    Log audit trail for model changes.
    Automatically excludes 'status' field from tracking.
    
    Args:
        entity_type: str - Type of entity (e.g., 'Material', 'Batch', 'Order')
        entity_id: str - ID of the entity
        action: str - Action type ('CREATE', 'UPDATE', 'DELETE')
        old_instance: dict - Old data
        new_instance: dict - New data
        user: str - Username making the change
        description: str - Optional description
        entity_name: str - Optional entity name (material_name, leather_type, etc.) for clarity
    """
    if action == 'CREATE':
        # Log all fields for creation (except excluded fields)
        if new_instance:
            for field, value in new_instance.items():
                if field not in EXCLUDED_FIELDS:
                    AuditTrail.objects.create(
                        user=user,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        entity_name=entity_name,
                        action=action,
                        field_name=field,
                        old_value=None,
                        new_value=str(value),
                        description=description or f'{entity_type} created',
                    )

    elif action == 'UPDATE':
        # Only log changed fields (except excluded fields)
        if old_instance and new_instance:
            for field, new_value in new_instance.items():
                if field not in EXCLUDED_FIELDS:
                    old_value = old_instance.get(field)
                    if old_value != new_value:
                        AuditTrail.objects.create(
                            user=user,
                            entity_type=entity_type,
                            entity_id=entity_id,
                            entity_name=entity_name,
                            action=action,
                            field_name=field,
                            old_value=str(old_value) if old_value is not None else None,
                            new_value=str(new_value),
                            description=description or f'{entity_type} field "{field}" updated',
                        )

    elif action == 'DELETE':
        # Log deletion with old values and entity name for clarity
        if old_instance:
            for field, value in old_instance.items():
                if field not in EXCLUDED_FIELDS:
                    AuditTrail.objects.create(
                        user=user,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        entity_name=entity_name,
                        action=action,
                        field_name=field,
                        old_value=str(value),
                        new_value=None,
                        description=description or f'{entity_type} deleted: {entity_name}',
                    )


def model_to_dict(instance, fields=None):
    """Convert a Django model instance to a dictionary."""
    if not instance:
        return {}
    
    result = {}
    for field in instance._meta.fields:
        if fields and field.name not in fields:
            continue
        value = getattr(instance, field.name)
        # Handle DecimalField, DateField, etc.
        if hasattr(value, 'isoformat'):
            value = value.isoformat()
        result[field.name] = value
    
    return result
