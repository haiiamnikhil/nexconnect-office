from rest_framework import viewsets, permissions, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.db import models
import os
from hrms.models import DocumentCategory, CompanyDocument
from hrms.data.dms_serializers import DocumentCategorySerializer, CompanyDocumentSerializer

class DocumentCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DocumentCategory.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class CompanyDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'category__name']

    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        qs = CompanyDocument.objects.filter(tenant=tenant)
        
        # Visibility Logic
        if not user.is_tenant_admin:
             # Employee sees ALL and their specific Department docs
             dept_id = getattr(user.employee, 'department_id', None) if hasattr(user, 'employee') else None
             qs = qs.filter(models.Q(visibility='ALL') | models.Q(visibility='DEPT', department_id=dept_id))
        
        return qs.order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, uploaded_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download document file"""
        document = self.get_object()
        
        if not document.document_file:
            raise Http404("File not found")
        
        # Get file path
        file_path = document.document_file.path
        
        if not os.path.exists(file_path):
            raise Http404("File not found on server")
        
        # Serve file
        response = FileResponse(open(file_path, 'rb'), content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        
        return response

