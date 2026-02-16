from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from hrms.models import AppraisalCycle, Goal, Review, Employee
from hrms.data.performance_serializers import (
    AppraisalCycleSerializer, GoalSerializer, ReviewSerializer, GoalUpdateSerializer,
    ReviewSubmitSerializer, ReviewManagerRatingSerializer
)

class AppraisalCycleViewSet(viewsets.ModelViewSet):
    serializer_class = AppraisalCycleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AppraisalCycle.objects.filter(tenant=self.request.user.tenant)

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see only their own goals
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            return Goal.objects.filter(tenant=user.tenant, employee=user.employee_profile)
        return Goal.objects.none()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'update_progress']:
            return GoalUpdateSerializer
        return GoalSerializer
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update goal progress percentage"""
        goal = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None:
            return Response({'error': 'Progress field required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            progress = int(progress)
            if not (0 <= progress <= 100):
                raise ValueError
        except (ValueError, TypeError):
            return Response({'error': 'Progress must be integer between 0-100'}, status=status.HTTP_400_BAD_REQUEST)
        
        goal.progress = progress
        
        # Auto-update status based on progress
        if progress == 100:
            goal.status = 'COMPLETED'
        elif progress > 0:
            goal.status = 'IN_PROGRESS'
        
        goal.save()
        return Response(GoalSerializer(goal).data)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        
        # Access Matrix:
        # 1. Employee sees their own reviews
        # 2. Manager sees reviews where they are the reviewer
        # 3. Admins see all (simplified for now to basic access)
        
        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            return Review.objects.filter(
                tenant=tenant
            ).filter(models.Q(employee=emp) | models.Q(reviewer=emp))
            
        return Review.objects.filter(tenant=tenant) # Admin fallback
    
    @action(detail=False, methods=['get'])
    def team_reviews(self, request):
        """Get reviews for manager's team members"""
        user = request.user
        
        if not hasattr(user, 'employee_profile'):
            return Response({'error': 'No employee profile found'}, status=status.HTTP_400_BAD_REQUEST)
        
        emp = user.employee_profile
        
        # Get reviews where current employee is the reviewer
        reviews = Review.objects.filter(
            tenant=user.tenant,
            reviewer=emp
        ).select_related('employee', 'appraisal_cycle').order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], serializer_class=ReviewSubmitSerializer)
    def submit_self_review(self, request, pk=None):
        review = self.get_object()
        if review.status != 'DRAFT':
             return Response({'error': 'Review already submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(status='SELF_SUBMITTED')
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], serializer_class=ReviewManagerRatingSerializer)
    def submit_manager_review(self, request, pk=None):
        review = self.get_object()
        # Ensure user is manager (logic to add later)
        if review.status != 'SELF_SUBMITTED':
             return Response({'error': 'Self review not completed yet'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(review, data=request.data, partial=True)
        if serializer.is_valid():
             # Auto-calculate final rating (simplified: equals manager rating)
            serializer.save(
                status='COMPLETED', 
                final_rating=serializer.validated_data.get('manager_rating')
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

