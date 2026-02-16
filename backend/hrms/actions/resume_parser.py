import re
import io

class ResumeParser:
    def parse(self, file_obj):
        """
        Parse resume file and return extracted data
        """
        text = ""
        filename = file_obj.name.lower()
        
        try:
            if filename.endswith('.pdf'):
                text = self._extract_pdf(file_obj)
            elif filename.endswith('.txt'):
                text = file_obj.read().decode('utf-8')
            elif filename.endswith('.docx'):
                text = "" # TODO: Add docx support
            
            # Extract Data
            return {
                'email': self._extract_email(text),
                'phone': self._extract_phone(text),
                'text': text
            }
        except Exception as e:
            print(f"Resume Parsing Failed: {e}")
            return {}

    def _extract_pdf(self, file_obj):
        try:
            # Try pypdf first
            from pypdf import PdfReader
            reader = PdfReader(file_obj)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except ImportError:
            try:
                # Fallback to PyPDF2
                import PyPDF2
                reader = PyPDF2.PdfReader(file_obj)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except ImportError:
                print("PDF Parser libraries not found (pypdf or PyPDF2)")
                return ""

    def _extract_email(self, text):
        email_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_regex, text)
        return match.group(0) if match else None

    def _extract_phone(self, text):
        # Basic phone extraction (10-12 digits, maybe with dashes)
        phone_regex = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
        match = re.search(phone_regex, text)
        return match.group(0) if match else None
