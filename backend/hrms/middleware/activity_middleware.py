from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import user_logged_in, user_logged_out
from django.dispatch import receiver
from users.models import UserActivity

class ActivityMiddleware(MiddlewareMixin):
    """
    Middleware to capture request metadata for signals
    """
    def process_request(self, request):
        if not hasattr(request, 'user'):
            return
        # Store metadata on request for access in views/signals if needed
        # But signals are decoupled.
        pass

# Signal Receivers for Login/Logout
@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    _log_activity(request, user, 'LOGIN', 'Authentication', 'User logged in')

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    _log_activity(request, user, 'LOGOUT', 'Authentication', 'User logged out')

def _log_activity(request, user, action, module, description):
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    # Handle Tenancy (Login/Logout might not have tenant context set yet depending on flow, but user has it)
    tenant = user.tenant
    
    UserActivity.objects.create(
        user=user,
        tenant=tenant,
        action=action,
        module=module,
        description=description,
        ip_address=ip,
        user_agent=user_agent
    )

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
