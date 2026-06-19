from django.contrib import admin

from .models import Batch, Material, Order, OrderItem


admin.site.register(Material)
admin.site.register(Batch)
admin.site.register(Order)
admin.site.register(OrderItem)
