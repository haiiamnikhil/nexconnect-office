from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for standardized error responses.
    Response format:
    {
        "status": "error",
        "code": 400,
        "message": "Error description",
        "errors": { field: [errors] }  # Optional validation details
    }
    """
    # Call REST framework's default handler first
    response = exception_handler(exc, context)

    # Standardize the response
    if response is not None:
        # Default data structure
        custom_response_data = {
            "status": "error",
            "code": response.status_code,
            "message": "An error occurred", # Default message
            "details": response.data
        }
        
        # Extract message from response.data if possible
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response_data['message'] = response.data['detail']
                # We don't delete from response.data, just don't include it in 'details' if it's the only thing
                if len(response.data) == 1:
                    if 'details' in custom_response_data:
                         del custom_response_data['details']
                else:
                    # If there are other fields, include them as details/errors
                    # Make a copy to avoid modifying original response.data potentially used elsewhere
                    details = response.data.copy()
                    del details['detail']
                    custom_response_data['errors'] = details
                    if 'details' in custom_response_data:
                         del custom_response_data['details']
            elif 'error' in response.data:
                custom_response_data['message'] = response.data['error']
                # Same logic for 'error' key if needed
            else:
                 # If no standard message key, use data as errors
                 custom_response_data['errors'] = response.data
                 if 'details' in custom_response_data:
                      del custom_response_data['details']
        
        elif isinstance(response.data, list):
             custom_response_data['errors'] = response.data
             if 'details' in custom_response_data:
                  del custom_response_data['details']

        response.data = custom_response_data
    else:
        # Handle non-DRF exceptions (e.g., standard Python exceptions) if desired
        # or let Django's standard 500 handler catch them.
        # For enterprise apps, we might want to catch 500s here too if configured.
        pass

    return response
