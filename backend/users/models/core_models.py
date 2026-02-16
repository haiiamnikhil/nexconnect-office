from django.contrib.auth.models import AbstractUser, Group, Permission, UserManager as DjangoUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from typing import Optional, Any

class UserManager(DjangoUserManager):
    """Custom manager for User model with tenant support."""
    def create_user(self, username: str, email: Optional[str] = None, password: Optional[str] = None, **extra_fields: Any) -> 'User':
        """
        Create and save a regular user with the given username and password.
        
        Args:
            username: Unique username for the user
            email: Optional email address
            password: Optional password (will be hashed)
            **extra_fields: Additional fields for the user model
            
        Returns:
            User: The created user instance
        """
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username: str, email: Optional[str] = None, password: Optional[str] = None, **extra_fields: Any) -> 'User':
        """
        Create and save a superuser with the given username and password.
        
        Args:
            username: Unique username for the superuser
            email: Optional email address
            password: Optional password (will be hashed)
            **extra_fields: Additional fields for the user model
            
        Returns:
            User: The created superuser instance
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class Tenant(models.Model):
    """
    Tenant model representing a company/organization in the multi-tenant system.
    
    Attributes:
        name: Company name
        domain: Unique domain identifier for the tenant
        created_at: Timestamp when the tenant was created
        is_active: Whether the tenant account is active
    """
    name = models.CharField(max_length=100, help_text="Company/organization name")
    domain = models.CharField(max_length=100, unique=True, help_text="Unique domain identifier")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, help_text="Whether the tenant is active")
    
    # Onboarding Fields
    onboarding_step = models.IntegerField(default=1, help_text="Current step in onboarding process")
    currency = models.CharField(max_length=3, default='USD', help_text="Default currency for the tenant")
    is_setup_complete = models.BooleanField(default=False, help_text="Whether the tenant has completed onboarding")
    status_actions = models.JSONField(default=dict, blank=True, help_text="Configuration for employee status actions")

    class Meta:
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name

class User(AbstractUser):
    """
    Custom user model with multi-tenant support and role-based access.
    
    Extends Django's AbstractUser to add tenant association and role management.
    
    Attributes:
        tenant: The company/organization this user belongs to
        role: User's role within the system (SUPER_ADMIN, TENANT_ADMIN, EMPLOYEE, MANAGER)
    """
    
    class Roles(models.TextChoices):
        """Available user roles in the system."""
        SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')  # SaaS platform owner
        TENANT_ADMIN = 'TENANT_ADMIN', _('Tenant Admin')  # Company administrator
        EMPLOYEE = 'EMPLOYEE', _('Employee')  # Regular user
        MANAGER = 'MANAGER', _('Manager')  # Team lead/manager

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.EMPLOYEE)
    must_change_password = models.BooleanField(
        default=False,
        help_text="If True, user must change password on next login"
    )
    
    objects = UserManager()
    
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="custom_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="custom_user_set",
        related_query_name="user",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-date_joined']

    def __str__(self) -> str:
        """String representation of the user."""
        return f"{self.username} ({self.tenant.name if self.tenant else 'Public'})"
    
    def get_full_name(self) -> str:
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_tenant_admin(self) -> bool:
        """Check if user is a tenant administrator."""
        return self.role in [self.Roles.TENANT_ADMIN, self.Roles.SUPER_ADMIN]
    
    @property
    def is_super_admin(self) -> bool:
        """Check if user is a super administrator."""
        return self.role == self.Roles.SUPER_ADMIN
