CREATE TABLE order_items_flat
(
    order_item_id     Int64,
    order_id          String,
    customer          String,
    fulfillment       LowCardinality(String),
    delivery_address  String,
    scheduled_date    Date,
    scheduled_time    String,
    payment_method    LowCardinality(String),
    status            LowCardinality(String),
    created_at        DateTime,
    material_name     LowCardinality(String),
    batch_code        LowCardinality(String),
    unit              LowCardinality(String),
    unit_price        Decimal(12, 2),
    qty               Int32,
    size_sqft         Nullable(Decimal(12, 2)),
    custom_size       Nullable(String),
    color             LowCardinality(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, material_name)