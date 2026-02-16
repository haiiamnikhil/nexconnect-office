from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from hrms.models.learning_models import Course, CourseCategory, Enrollment, Lesson, LessonProgress
from hrms.data.learning_serializers import (
    CourseSerializer, CourseDetailSerializer, CourseCategorySerializer,
    EnrollmentSerializer, LessonProgressSerializer
)

from hrms.permissions import HasAppPermission

class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    permission_classes = [permissions.IsAuthenticated, HasAppPermission]
    resource_name = 'learning'

    def get_queryset(self):
        return self.queryset.filter(tenant=self.request.user.employee_profile.tenant)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, HasAppPermission]
    resource_name = 'learning'

    def get_queryset(self):
        return self.queryset.filter(tenant=self.request.user.employee_profile.tenant)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        employee = request.user.employee_profile
        
        if Enrollment.objects.filter(employee=employee, course=course).exists():
            return Response({'detail': 'Already enrolled'}, status=status.HTTP_400_BAD_REQUEST)
        
        enrollment = Enrollment.objects.create(
            employee=employee,
            course=course,
            tenant=employee.tenant,
            status='ENROLLED'
        )
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, HasAppPermission]
    resource_name = 'learning'

    def get_queryset(self):
        # Employees see their own, HR/Admins might see all (logic to be added later)
        return self.queryset.filter(employee=self.request.user.employee_profile)

    @action(detail=True, methods=['post'])
    def complete_lesson(self, request, pk=None):
        enrollment = self.get_object()
        lesson_id = request.data.get('lesson_id')
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        
        # Check if already completed
        if not LessonProgress.objects.filter(enrollment=enrollment, lesson=lesson).exists():
            LessonProgress.objects.create(enrollment=enrollment, lesson=lesson)
            
            # Update progress
            total_lessons = Lesson.objects.filter(module__course=enrollment.course).count()
            completed_lessons = LessonProgress.objects.filter(enrollment=enrollment).count()
            
            if total_lessons > 0:
                enrollment.progress_percentage = int((completed_lessons / total_lessons) * 100)
                
            if enrollment.progress_percentage == 100:
                enrollment.status = 'COMPLETED'
                enrollment.completed_at = timezone.now()
            else:
                enrollment.status = 'IN_PROGRESS'
                
            enrollment.save()
            
        return Response({'status': 'Lesson completed', 'progress': enrollment.progress_percentage})
