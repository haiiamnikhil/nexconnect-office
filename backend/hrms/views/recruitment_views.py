from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from hrms.models import JobPosting, Candidate, JobApplication, Interview
from hrms.data.recruitment_serializers import JobPostingSerializer, CandidateSerializer, JobApplicationSerializer, InterviewSerializer

from hrms.permissions import HasAppPermission

class JobPostingViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'recruitment'

    def get_queryset(self):
        return JobPosting.objects.filter(tenant=self.request.user.tenant)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_jobs(self, request):
        """
        Public endpoint for career pages
        TODO: Filter by Tenant Domain/ID if we want a public careers page per tenant
        """
        # For now, just return OPEN jobs for specific tenant if provided in query param
        tenant_name = request.query_params.get('company')
        if tenant_name:
            return Response(JobPostingSerializer(JobPosting.objects.filter(tenant__name__iexact=tenant_name, status='OPEN'), many=True).data)
        
        # Or return nothing if no context
        return Response([])

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_detail(self, request, pk=None):
        """
        Public endpoint for a single job detail
        """
        try:
            job = JobPosting.objects.get(pk=pk, status='OPEN')
            return Response(JobPostingSerializer(job).data)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'recruitment'


    def get_queryset(self):
        return Candidate.objects.filter(tenant=self.request.user.tenant)

    def create(self, request, *args, **kwargs):
        """
        Override create to parse resume if uploaded
        """
        resume_file = request.FILES.get('resume')
        data = request.data.copy()
        
        if resume_file:
            from hrms.actions.resume_parser import ResumeParser
            parser = ResumeParser()
            parsed_data = parser.parse(resume_file)
            
            # Auto-fill if missing
            if not data.get('email') and parsed_data.get('email'):
                data['email'] = parsed_data['email']
            
            if not data.get('phone') and parsed_data.get('phone'):
                data['phone'] = parsed_data['phone']
                
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'recruitment'

    def get_queryset(self):
        return JobApplication.objects.filter(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def change_stage(self, request, pk=None):
        app = self.get_object()
        new_stage = request.data.get('stage')
        if new_stage not in dict(JobApplication.STAGE_CHOICES):
             return Response({'error': 'Invalid stage'}, status=status.HTTP_400_BAD_REQUEST)
        
        app.current_stage = new_stage
        app.save()
        
        # Trigger Workflow if Hired
        if new_stage == 'HIRED':
            try:
                from hrms.actions.recruitment_workflow import create_employee_from_candidate
                # Check if employee already exists to avoid duplicates (optional check)
                if not Employee.objects.filter(personal_email=app.candidate.email).exists():
                    create_employee_from_candidate(app)
            except Exception as e:
                # Log error but don't fail the stage change? Or return warning?
                print(f"Failed to auto-create employee: {e}")
                return Response({'status': 'Stage updated', 'warning': f'Employee creation failed: {str(e)}', 'current_stage': app.current_stage})
        
        # Notify Candidate (if allowed)
        from hrms.actions.notification_utils import notify_application_stage_change
        notify_application_stage_change(app)

        return Response({'status': 'Stage updated', 'current_stage': app.current_stage})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def public_apply(self, request):
        """
        Public endpoint for applying to a job
        Payload: { job_id, first_name, last_name, email, resume (file) }
        """
        job_id = request.data.get('job_id')
        email = request.data.get('email')
        
        if not job_id or not email:
            return Response({'error': 'Job ID and Email are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            job = JobPosting.objects.get(id=job_id, status='OPEN')
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found or not open'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check/Create Candidate
        candidate, created = Candidate.objects.get_or_create(
            email=email,
            tenant=job.tenant,
            defaults={
                'first_name': request.data.get('first_name', ''),
                'last_name': request.data.get('last_name', ''),
                'phone': request.data.get('phone', ''),
                'source': 'Website'
            }
        )
        
        # Handle Resume Upload
        if request.FILES.get('resume'):
            candidate.resume = request.FILES.get('resume')
            candidate.save()
            
            # Optional: Trigger Resume Parser here if needed
            # from hrms.actions.resume_parser import ResumeParser...
        
        # Create Application
        if JobApplication.objects.filter(job=job, candidate=candidate).exists():
             return Response({'error': 'Already applied for this job'}, status=status.HTTP_400_BAD_REQUEST)
             
        app = JobApplication.objects.create(
            job=job,
            candidate=candidate,
            tenant=job.tenant,
            current_stage='APPLIED'
        )
        
        return Response({'status': 'Applied successfully', 'application_id': app.id}, status=status.HTTP_201_CREATED)

class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'recruitment'

    def get_queryset(self):
        return Interview.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def get_calendar(self, request):
        """
        Get interviews for calendar view
        Query params: start_date, end_date (YYYY-MM-DD)
        """
        tenant = request.user.tenant
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Default to current week if no dates provided
        if not start_date or not end_date:
            today = timezone.now().date()
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        else:
            from datetime import datetime
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        interviews = Interview.objects.filter(
            tenant=tenant,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date
        ).select_related('application__candidate', 'application__job', 'interviewer').order_by('start_time')
        
        serializer = self.get_serializer(interviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_interviews(self, request):
        """Get interviews where current user is the interviewer"""
        user = request.user
        
        if not hasattr(user, 'employee_profile'):
            return Response({'error': 'No employee profile found'}, status=status.HTTP_400_BAD_REQUEST)
        
        interviews = Interview.objects.filter(
            tenant=user.tenant,
            interviewer=user.employee_profile,
            start_time__gte=timezone.now()
        ).select_related('application__candidate', 'application__job').order_by('start_time')
        
        serializer = self.get_serializer(interviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark interview as completed with feedback"""
        interview = self.get_object()
        
        interview.status = 'COMPLETED'
        interview.feedback = request.data.get('feedback', '')
        interview.rating = request.data.get('rating', 0)
        interview.save()
        
        return Response(self.get_serializer(interview).data)

