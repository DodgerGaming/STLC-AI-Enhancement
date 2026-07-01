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
    path('authentication/', include('api.authentication.urls')),
]
