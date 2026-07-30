from django.urls import path
from .views import AuthUserListCreateView, AuthUserDetailView, LoginView

urlpatterns = [
    path('users/', AuthUserListCreateView.as_view(), name='authuser-list'),
    path('users/<int:pk>/', AuthUserDetailView.as_view(), name='authuser-detail'),
    path('login/', LoginView.as_view(), name='auth-login'),
]
