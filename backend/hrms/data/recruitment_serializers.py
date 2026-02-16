from rest_framework import serializers
from hrms.models import JobPosting, Candidate, JobApplication, Interview

class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    location_name = serializers.ReadOnlyField(source='location.name')
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = JobPosting
        fields = '__all__'
        read_only_fields = ['tenant', 'posted_by']
    
    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        validated_data['posted_by'] = self.context['request'].user
        return super().create(validated_data)

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class JobApplicationSerializer(serializers.ModelSerializer):
    candidate_details = CandidateSerializer(source='candidate', read_only=True)
    job_title = serializers.ReadOnlyField(source='job.title')

    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class InterviewSerializer(serializers.ModelSerializer):
    interviewer_name = serializers.ReadOnlyField(source='interviewer.user.get_full_name')
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
