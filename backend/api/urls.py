from django.urls import path
from . import views

urlpatterns = [
    path('ping/', views.ping, name='ping'),
    path('materials/', views.material_list, name='material-list'),
    path('materials/<str:material_id>/', views.material_detail, name='material-detail'),
    path('materials/<str:material_id>/batches/', views.material_batches, name='material-batches'),
    path('batches/', views.create_batch, name='create-batch'),
    path('orders/', views.create_order, name='create-order'),
    path('orders/list/', views.order_list, name='order-list'),
    path('audit-trail/', views.audit_trail_list, name='audit-trail-list'),
]
