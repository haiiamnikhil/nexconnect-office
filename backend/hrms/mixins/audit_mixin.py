from users.models import UserActivity

class AuditLogMixin:
    """
    Mixin to log Create/Update/Delete actions in ViewSets
    """
    activity_module = 'General' # Override this in ViewSet

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_activity('CREATE', f"Created {self.activity_module}: {str(instance)}")
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_activity('UPDATE', f"Updated {self.activity_module}: {str(instance)}")
        return instance

    def perform_destroy(self, instance):
        desc = f"Deleted {self.activity_module}: {str(instance)}"
        instance.delete()
        self._log_activity('DELETE', desc)

    def _log_activity(self, action, description):
        user = self.request.user
        if not user or not user.is_authenticated:
            return
            
        # Get IP
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
            
        UserActivity.objects.create(
            user=user,
            tenant=getattr(user, 'tenant', None),
            action=action,
            module=self.activity_module,
            description=description,
            ip_address=ip,
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')[:500]
        )
