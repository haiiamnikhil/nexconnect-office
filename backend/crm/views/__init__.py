"""
CRM app views
Exports: ClientViewSet, LeadViewSet, InteractionViewSet, BaseTenantViewSet
"""
from .crm_views import ClientViewSet, LeadViewSet, InteractionViewSet, BaseTenantViewSet

__all__ = ['ClientViewSet', 'LeadViewSet', 'InteractionViewSet', 'BaseTenantViewSet']
