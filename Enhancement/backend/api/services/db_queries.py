from django.db import connection


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_materials_raw(search=None, leather_type=None):
    """Return list of materials. Optionally filter by search string and leather_type.

    search: substring to match against material_name or material_id (case-insensitive)
    leather_type: exact match against the leather_type column
    """
    base_sql = """
        SELECT
            material_id,
            material_name,
            leather_type,
            sale_price,
            unit_price,
            unit,
            tag,
            description,
            total_stock AS totalStock,
            batch_count AS batchCount
        FROM api_material m
    """

    where_clauses = []
    params = []

    if search:
        where_clauses.append("(LOWER(m.material_name) LIKE LOWER(%s) OR LOWER(m.material_id) LIKE LOWER(%s))")
        like_param = f"%{search}%"
        params.extend([like_param, like_param])

    if leather_type and leather_type != 'All':
        where_clauses.append("m.leather_type = %s")
        params.append(leather_type)

    where_sql = ''
    if where_clauses:
        where_sql = ' WHERE ' + ' AND '.join(where_clauses)

    order_sql = ' ORDER BY material_name'

    raw_sql = base_sql + where_sql + order_sql

    with connection.cursor() as cursor:
        cursor.execute(raw_sql, params)
        return dictfetchall(cursor)
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
            added_at
        FROM api_batch
        WHERE material_id = %s
        ORDER BY status DESC, batch_code
    """
    with connection.cursor() as cursor:
        cursor.execute(raw_sql, [material_id])
        return dictfetchall(cursor)


def get_material_detail_raw(material_id):
    """Return material detail aggregated with batch totals for a single material_id.

    Returns a dict with keys:
      material_id, material_name, leather_type, sale_price, unit_price,
      unit, tag, description, totalStock, batchCount
    or None if not found.
    """
    raw_sql = """
        SELECT
            m.material_id,
            m.material_name,
            m.leather_type,
            m.sale_price,
            m.unit_price,
            m.unit,
            m.tag,
            m.description,
            COALESCE(SUM(b.size_sqft * b.quantity), 0) AS totalStock,
            COUNT(b.batch_code) AS batchCount
        FROM api_material m
        LEFT JOIN api_batch b ON m.material_id = b.material_id
        WHERE m.material_id = %s
        GROUP BY
            m.material_id,
            m.material_name,
            m.leather_type,
            m.sale_price,
            m.unit_price,
            m.unit,
            m.tag,
            m.description
    """
    with connection.cursor() as cursor:
        cursor.execute(raw_sql, [material_id])
        rows = dictfetchall(cursor)
        return rows[0] if rows else None