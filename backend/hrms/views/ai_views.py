
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from hrms.models import JobPosting, Candidate, JobApplication
from hrms.data.recruitment_serializers import JobPostingSerializer, CandidateSerializer, JobApplicationSerializer
from hrms.models import CompanyDocument

class AskHRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').lower()
        
        # Simple Keyword Matching Logic (Mock AI)
        answer = "I'm not sure about that. Please check the Policy Documents."
        
        if 'leave' in question:
            answer = "You can apply for leave under the 'Leave Management' section. We offer Sick, Casual, and Earned leaves."
        elif 'holiday' in question:
            answer = "Our holiday calendar is available in the 'Organization' section."
        elif 'salary' in question or 'payslip' in question:
            answer = "Payslips are generated on the last working day of the month. Check 'Payroll' for details."
        elif 'policy' in question:
            # Search DMS if available
            docs = CompanyDocument.objects.filter(title__icontains=question.split()[-1])
            if docs.exists():
                doc_titles = ", ".join([d.title for d in docs])
                answer = f"I found some related policies: {doc_titles}. You can view them in the Document Library."
            else:
                answer = "You can find all company policies in the 'Documents' section."

        return Response({'answer': answer})
