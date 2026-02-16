from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

# Existing auth views
from .views.auth_views import CustomTokenObtainPairView, change_password, RegisterTenantView, me

# New views/viewsets implied by the edit
from .views.user_views import UserViewSet
from .views.tenant_views import TenantViewSet
from .views.onboarding_views import TenantOnboardingViewSet
from .views.activity_views import UserActivityViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'onboarding', TenantOnboardingViewSet, basename='tenant-onboarding')
router.register(r'activities', UserActivityViewSet, basename='user-activity')

urlpatterns = [
    path('', include(router.urls)), # Include router URLs
    path('register/', RegisterTenantView.as_view(), name='register_tenant'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', change_password, name='change_password'),
    path('me/', me, name='me'),
]
