from rest_framework import serializers
from erp.models import Project, Task, InventoryItem, StockTransaction

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    manager_name = serializers.CharField(source='manager.user.get_full_name', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.user.get_full_name', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['tenant']

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at']

class StockTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockTransaction
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'created_by']
