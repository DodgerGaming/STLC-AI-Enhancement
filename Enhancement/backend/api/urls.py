from django.urls import path
from . import views
from django.urls import include

urlpatterns = [
    path('ping/', views.ping, name='ping'),
    path('materials/', views.material_list, name='material-list'),
    path('materials/<str:material_id>/', views.material_detail, name='material-detail'),
    path('materials/<str:material_id>/batches/', views.material_batches, name='material-batches'),
    path('batches/', views.create_batch, name='create-batch'),
    path('batches/<str:batch_code>/', views.batch_detail, name='batch-detail'),
    path('orders/', views.orders, name='orders'),
    path('orders/<str:order_id>/', views.order_detail, name='order-detail'),
    path('audit-trail/', views.audit_trail_list, name='audit-trail-list'),
    path('analytics/best-sellers/', views.best_selling_materials, name='best-selling-materials'),
    path('analytics/peak-day/', views.peak_day_of_week, name='peak-day-of-week'),
    path('analytics/peak-hour/', views.peak_hour_of_day, name='peak-hour-of-day'),
    path('analytics/trend/', views.daily_sales_trend, name='daily-sales-trend'),
    path('insights/search/', views.semantic_search_insights, name='semantic-search-insights'),
    path('authentication/', include('api.authentication.urls')),
    
]
