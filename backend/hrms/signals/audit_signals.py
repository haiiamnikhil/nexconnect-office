from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core import serializers
import json

# Import Models to Track
from hrms.models import Employee, Attendance, LeaveRequest, Department, Designation
from users.models import UserActivity, User

# We need a way to get the 'current user' in signals.
# Since Django signals are decoupled from Request, we usually need middleware to set thread-local storage 
# OR we rely on the ViewSet to save 'modified_by' which we can then read.
# For this implementation, we will use a simpler approach:
# We will focus on Login/Logout first (Middleware).
# For Data Changes, we will use a Mixin in ViewSets to capture the request user, 
# because ThreadLocal is risky in Async/Concurrent environments.

# However, to meet the user's request for "User Activities", we can try to inspect the stack or use a global request if available, 
# but the cleanest way in DRF is overriding `perform_create` / `perform_update` / `perform_destroy` in a BaseAuditViewSet.

# Strategy Change: instead of Signals (which lack Request context easily), 
# I will create a `AuditLogMixin` for ViewSets.

pass
