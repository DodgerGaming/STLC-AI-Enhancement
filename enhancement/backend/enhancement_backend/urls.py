from django.contrib import admin
from django.urls import path
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "message": "Django backend is running"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
]
