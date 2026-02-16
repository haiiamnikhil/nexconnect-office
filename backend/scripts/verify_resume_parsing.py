import os
import sys
import io
# Setup Django Environment
sys.path.append(os.getcwd())
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
import django
django.setup()

from hrms.actions.resume_parser import ResumeParser
from django.core.files.uploadedfile import SimpleUploadedFile

def verify_resume_parsing():
    print("--- Verifying Resume Parsing ---")
    
    # 1. Test Text Parser
    content = """
    John Doe
    Software Engineer
    Email: john.doe@example.com
    Phone: 123-456-7890
    Experience: 5 years in Python, Django.
    """
    
    # Create a mock file object
    file_obj = SimpleUploadedFile("resume.txt", content.encode('utf-8'), content_type="text/plain")
    
    parser = ResumeParser()
    data = parser.parse(file_obj)
    
    print(f"Parsed Data: {data}")
    
    if data.get('email') == 'john.doe@example.com':
        print("✅ Email Extraction Verified")
    else:
        print(f"❌ Email Extraction Failed. Got: {data.get('email')}")
        
    if '123-456-7890' in str(data.get('phone')):
        print("✅ Phone Extraction Verified")
    else:
        print(f"❌ Phone Extraction Failed. Got: {data.get('phone')}")

if __name__ == "__main__":
    verify_resume_parsing()
