from django.contrib import admin
from .models import AuthUser


@admin.register(AuthUser)
class AuthUserAdmin(admin.ModelAdmin):
    list_display = ('id','employee_id','username','full_name','role','email','is_active')
    search_fields = ('employee_id','username','first_name','last_name','email')
