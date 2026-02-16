from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.erp_views import ProjectViewSet, TaskViewSet, InventoryItemViewSet, StockTransactionViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'stock', StockTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
