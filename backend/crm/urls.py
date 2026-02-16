from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.crm_views import ClientViewSet, LeadViewSet, InteractionViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'interactions', InteractionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
