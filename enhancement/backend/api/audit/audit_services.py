from api.models import AuditTrail

EXCLUDED_FIELDS = {'status', 'updated_at', 'created_at'}


def model_to_dict(instance, fields=None):
    if not instance:
        return {}

    result = {}
    for field in instance._meta.fields:
        if fields and field.name not in fields:
            continue
        value = getattr(instance, field.name)
        if hasattr(value, 'isoformat'):
            value = value.isoformat()
        result[field.name] = value
    return result


def log_audit(entity_type, entity_id, action, old_instance=None, new_instance=None, user=None, description='', entity_name=''):
    """
    `user` should now be a CustomUser instance (or None for system-generated
    actions) rather than a plain string. AuditTrail.user is a ForeignKey to
    settings.AUTH_USER_MODEL, so role is looked up via user.role at read time
    instead of being duplicated into every audit row.
    """
    if action == 'CREATE':
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
                        new_value=str(value) if value is not None else None,
                        description=description or f'{entity_type} created',
                    )

    elif action == 'UPDATE':
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
                            new_value=str(new_value) if new_value is not None else None,
                            description=description or f'{entity_type} field "{field}" updated',
                        )

    elif action == 'DELETE':
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
                        old_value=str(value) if value is not None else None,
                        new_value=None,
                        description=description or f'{entity_type} deleted: {entity_name}',
                    )