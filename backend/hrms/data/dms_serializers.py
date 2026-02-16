from rest_framework import serializers
from hrms.models import DocumentCategory, CompanyDocument

class DocumentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCategory
        fields = '__all__'
        read_only_fields = ['tenant']

class CompanyDocumentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = CompanyDocument
        fields = '__all__'
        read_only_fields = ['tenant', 'uploaded_by', 'uploaded_at']
