from rest_framework import serializers
from crm.models import Client, Lead, Interaction

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at']

class LeadSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.user.get_full_name', read_only=True)

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at']

class InteractionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Interaction
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'created_at']
