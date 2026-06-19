from rest_framework import serializers
from .models import AuthUser


class AuthUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = AuthUser
        fields = ['id','employee_id','username','password','first_name','middle_name','last_name','suffix','full_name','role','email','is_active','created_at']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Hash password using Django's default hasher
        from django.contrib.auth.hashers import make_password
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        from django.contrib.auth.hashers import make_password
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)
