from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from hrms.models import Department, Designation, Location, Employee
from hrms.data.org_serializers import DepartmentSerializer, DesignationSerializer, LocationSerializer, OrgHierarchySerializer


from hrms.permissions import HasAppPermission
from hrms.mixins.audit_mixin import AuditLogMixin

class DepartmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """ViewSet for Department management"""
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'department'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    activity_module = 'Department'
    
    def get_queryset(self):
        return Department.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Get all active employees in this department"""
        department = self.get_object()
        from hrms.data.employee_serializers import EmployeeListSerializer
        employees = department.employees.filter(is_active=True)
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def designations(self, request, pk=None):
        """Get all designations in this department"""
        department = self.get_object()
        designations = department.designations.filter(is_active=True)
        serializer = DesignationSerializer(designations, many=True, context={'request': request})
        return Response(serializer.data)


class DesignationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """ViewSet for Designation management"""
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'designation'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'level', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['level', 'title', 'created_at']
    ordering = ['level', 'title']
    activity_module = 'Designation'
    
    def get_queryset(self):
        return Designation.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('department')
    
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """Get designations grouped by hierarchy level"""
        designations = self.get_queryset().filter(is_active=True)
        
        levels = {}
        for designation in designations:
            level = designation.level
            if level not in levels:
                levels[level] = []
            levels[level].append(DesignationSerializer(designation, context={'request': request}).data)
        
        return Response({
            'levels': sorted([
                {'level': k, 'designations': v}
                for k, v in levels.items()
            ], key=lambda x: x['level'])
        })


class LocationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """ViewSet for Location management"""
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'location'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'state', 'country', 'is_headquarters', 'is_active']
    search_fields = ['name', 'code', 'city', 'address']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['-is_headquarters', 'name']
    activity_module = 'Location'
    
    def get_queryset(self):
        return Location.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def headquarters(self, request):
        """Get the headquarters location"""
        hq = self.get_queryset().filter(is_headquarters=True, is_active=True).first()
        if hq:
            serializer = self.get_serializer(hq)
            return Response(serializer.data)
        return Response({'detail': 'No headquarters found'}, status=status.HTTP_404_NOT_FOUND)


class OrgHierarchyViewSet(viewsets.ViewSet):
    """ViewSet for organization hierarchy overview"""
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'organization'
    
    def list(self, request):
        """Get complete organization hierarchy"""
        tenant = request.user.tenant
        
        departments = Department.objects.filter(tenant=tenant)
        designations = Designation.objects.filter(tenant=tenant, is_active=True).select_related('department')
        locations = Location.objects.filter(tenant=tenant, is_active=True)
        
        employees = Employee.objects.filter(tenant=tenant)
        total_employees = employees.count()
        total_active = employees.filter(is_active=True).count()
        
        data = {
            'departments': departments,
            'designations': designations,
            'locations': locations,
            'total_employees': total_employees,
            'total_active_employees': total_active,
        }
        
        serializer = OrgHierarchySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical organization tree structure"""
        tenant = request.user.tenant
        employees = Employee.objects.filter(tenant=tenant, is_active=True).select_related('reporting_manager')
        
        # Build map
        employee_map = {}
        for emp in employees:
            employee_map[emp.id] = {
                'label': emp.get_full_name(),
                'type': 'person',
                'styleClass': 'p-person',
                'expanded': True,
                'data': {
                    'id': emp.id,
                    'title': emp.designation,
                    'avatar': '', # Add avatar URL if available
                    'name': emp.get_full_name()
                },
                'children': []
            }
            
        # Build tree
        roots = []
        for emp in employees:
            node = employee_map[emp.id]
            if emp.reporting_manager_id and emp.reporting_manager_id in employee_map:
                parent = employee_map[emp.reporting_manager_id]
                parent['children'].append(node)
            else:
                roots.append(node)
                
        return Response(roots)
