from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, PermissionViewSet, 
    UserRoleAssignmentViewSet, PermissionMatrixViewSet
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'user-roles', UserRoleAssignmentViewSet, basename='user-role-assignment')
router.register(r'permission-matrix', PermissionMatrixViewSet, basename='permission-matrix')

urlpatterns = [
    path('', include(router.urls)),
]
