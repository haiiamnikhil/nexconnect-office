from rest_framework import viewsets, permissions
from users.models import UserActivity
from rest_framework import serializers

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = '__all__'

class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing User Activity Logs.
    Restricted to Super Users or Admin roles.
    """
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = UserActivity.objects.all()
        
        # Security: Only Admins see all
        if not (user.is_superuser or user.role in ['SUPER_ADMIN', 'ADMIN']):
             # Regular users see nothing (or their own? Request implies superuser view)
             return UserActivity.objects.none()
             
        # Filter by Target User ID
        target_user_id = self.request.query_params.get('user_id')
        if target_user_id:
            queryset = queryset.filter(user__id=target_user_id)
            
        return queryset
