from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from hrms.models import Employee, EmployeeDocument, EmployeeSkill, Department
from hrms.data.employee_serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer,
    EmployeeCreateUpdateSerializer, EmployeeDocumentSerializer,
    EmployeeSkillSerializer
)
from hrms.data.serializers import DepartmentSerializer
from hrms.mixins.audit_mixin import AuditLogMixin
from hrms.services.employee_service import EmployeeService


class EmployeeViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Employee CRUD operations with filtering and search
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'designation', 'employee_status', 'employment_type', 'is_active']
    search_fields = ['employee_code', 'first_name', 'last_name', 'personal_email', 'mobile_number']
    ordering_fields = ['created_at', 'first_name', 'employee_code', 'date_of_joining']
    ordering = ['-created_at']
    activity_module = 'Employee'
    
    def get_queryset(self):
        return Employee.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('department', 'reporting_manager')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EmployeeCreateUpdateSerializer
        return EmployeeDetailSerializer
    
    @action(detail=True, methods=['get'])
    def reportees(self, request, pk=None):
        """Get all employees reporting to this employee"""
        employee = self.get_object()
        reportees = Employee.objects.filter(
            reporting_manager=employee,
            tenant=request.user.tenant
        )
        serializer = EmployeeListSerializer(reportees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's employee profile"""
        try:
            employee = Employee.objects.get(
                user=request.user, 
                tenant=request.user.tenant
            )
            serializer = EmployeeDetailSerializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            # Self-healing: Create profile if missing (especially for Admins)
            try:
                from hrms.services.tenant_init_service import TenantInitializationService
                employee = TenantInitializationService.ensure_employee_profile(request.user, request.user.tenant)
                
                # Refresh permissions/assignments just in case - implementation details
                
                serializer = EmployeeDetailSerializer(employee)
                return Response(serializer.data)
            except Exception as e:
                return Response(
                    {'detail': f'Employee profile not found and auto-creation failed: {str(e)}'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for employees"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'detail': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        employees = self.get_queryset().filter(
            Q(employee_code__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(personal_email__icontains=query) |
            Q(mobile_number__icontains=query)
        )
        
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get employee statistics"""
        queryset = self.get_queryset()
        
        total = queryset.count()
        active = queryset.filter(employee_status='ACTIVE').count()
        probation = queryset.filter(employee_status='PROBATION').count()
        notice = queryset.filter(employee_status='NOTICE').count()
        
        by_department = {}
        for dept_id, dept_name in queryset.values_list('department__id', 'department__name').distinct():
            if dept_id:
                by_department[dept_name] = queryset.filter(department__id=dept_id).count()
        
        return Response({
            'total': total,
            'by_status': {
                'active': active,
                'probation': probation,
                'notice': notice
            },
            'by_department': by_department
        })
    
    @action(detail=True, methods=['get'])
    def user_stats(self, request, pk=None):
        """Get quick stats for individual employee profile"""
        employee = self.get_object()
        
        try:
            stats = EmployeeService.get_employee_stats(employee)
            return Response(stats)
        except Exception as e:
             # Global handler will catch this, but for specific service errors we can map or raise
             raise e

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request, pk=None):
        """Upload employee profile picture"""
        employee = self.get_object()
        
        # Check if user has permission to update this employee
        if request.user.id != employee.user.id and not request.user.is_staff:
             return Response(
                {'error': 'You do not have permission to update this employee'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            doc = EmployeeService.upload_avatar(employee, avatar, request.user)
            
            return Response({
                'avatar_url': request.build_absolute_uri(doc.file.url),
                'message': 'Avatar uploaded successfully'
            })
        except Exception as e:
            # Let global handler manage known exceptions, or re-raise
            raise e


class EmployeeDocumentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Employee Document management
   """
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'document_type']
    activity_module = 'Employee Document'
    
    def get_queryset(self):
        return EmployeeDocument.objects.filter(
            employee__tenant=self.request.user.tenant
        ).select_related('employee', 'uploaded_by')
    
    def perform_create(self, serializer):
        # Auto-assign uploaded_by and calculate file size
        file = self.request.FILES.get('file')
        file_size = file.size if file else None
        serializer.save(
            uploaded_by=self.request.user,
            file_size=file_size
        )
        self._log_activity('CREATE', f"Uploaded document {serializer.instance.document_name} for {serializer.instance.employee}")
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Get all documents for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        
        if not employee_id:
            return Response(
                {'detail': 'employee_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(employee__id=employee_id)
        serializer = self.get_serializer(documents, many=True, context={'request': request})
        return Response(serializer.data)


class EmployeeSkillViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Employee Skill management
    """
    serializer_class = EmployeeSkillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'proficiency']
    search_fields = ['skill_name', 'certification_name']
    ordering_fields = ['proficiency', 'years_of_experience', 'created_at']
    ordering = ['-proficiency', '-years_of_experience']
    activity_module = 'Employee Skill'
    
    def get_queryset(self):
        return EmployeeSkill.objects.filter(
            employee__tenant=self.request.user.tenant
        ).select_related('employee')
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Get all skills for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        
        if not employee_id:
            return Response(
                {'detail': 'employee_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        skills = self.get_queryset().filter(employee__id=employee_id)
        serializer = self.get_serializer(skills, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def skill_summary(self, request):
        """Get aggregated skill summary across organization"""
        skills = self.get_queryset().values('skill_name').distinct()
        
        summary = []
        for skill in skills:
            skill_name = skill['skill_name']
            count = self.get_queryset().filter(skill_name=skill_name).count()
            avg_experience = self.get_queryset().filter(
                skill_name=skill_name
            ).aggregate(models.Avg('years_of_experience'))['years_of_experience__avg']
            
            summary.append({
                'skill_name': skill_name,
                'employee_count': count,
                'avg_experience': round(avg_experience, 1) if avg_experience else 0
            })
        
        return Response(sorted(summary, key=lambda x: x['employee_count'], reverse=True))


class DepartmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for Department management
    """
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    activity_module = 'Department'
    
    def get_queryset(self):
        return Department.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.request.user.tenant)
        self._log_activity('CREATE', f"Created Department: {instance.name}")
    
    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Get all employees in this department"""
        department = self.get_object()
        employees = Employee.objects.filter(
            department=department,
            tenant=request.user.tenant
        )
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)
