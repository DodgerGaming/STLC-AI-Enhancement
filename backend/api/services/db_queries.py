from django.db import connection


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_materials_raw():
    raw_sql = """
        SELECT
            material_id,
            material_name,
            leather_type,
            sku,
            sale_price,
            unit_price,
            unit,
            tint,
            tag,
            total_stock AS totalStock,
            batch_count AS batchCount
        FROM api_material
        ORDER BY material_name
    """
    with connection.cursor() as cursor:
        cursor.execute(raw_sql)
        return dictfetchall(cursor)


def get_batches_for_material_raw(material_id):
    raw_sql = """
        SELECT
            batch_code,
            material_id,
            size_sqft,
            quantity,
            sale_price,
            unit_price,
            company,
            status,
            quality_grade,
            added
        FROM api_batch
        WHERE material_id = %s
        ORDER BY status DESC, batch_code
    """
    with connection.cursor() as cursor:
        cursor.execute(raw_sql, [material_id])
        return dictfetchall(cursor)
