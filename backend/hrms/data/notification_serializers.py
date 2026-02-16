from rest_framework import serializers
from hrms.models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['tenant', 'user', 'created_at']
