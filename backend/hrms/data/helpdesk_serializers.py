from rest_framework import serializers
from hrms.models import Ticket, TicketComment

class TicketCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = TicketComment
        fields = '__all__'
        read_only_fields = ['tenant', 'user', 'ticket']

class TicketSerializer(serializers.ModelSerializer):
    requester_name = serializers.ReadOnlyField(source='requester.get_full_name')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.get_full_name')
    comments = TicketCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['tenant', 'requester', 'created_at', 'updated_at', 'resolved_at']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        validated_data['requester'] = self.context['request'].user
        return super().create(validated_data)
