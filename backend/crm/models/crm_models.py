from django.db import models
from django.utils.translation import gettext_lazy as _

class Client(models.Model):
    """
    Client model representing a customer/company in the CRM system.
    
    Attributes:
        tenant: Organization this client belongs to
        name: Client/company name
        email: Primary contact email
        phone: Contact phone number
        address: Physical address
        industry: Business industry/sector
        created_at: When the client was added
    """
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='clients', help_text="Organization this client belongs to")
    name = models.CharField(max_length=200, help_text="Client/company name")
    email = models.EmailField(help_text="Primary contact email")
    phone = models.CharField(max_length=50, blank=True, help_text="Contact phone number")
    address = models.TextField(blank=True, help_text="Physical address")
    industry = models.CharField(max_length=100, blank=True, help_text="Business industry/sector")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['email']),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.tenant.name})"

class Lead(models.Model):
    """
    Lead model representing a sales opportunity.
    
    Tracks the progress of potential sales from initial contact to win/loss.
    
    Attributes:
        tenant: Organization managing this lead
        title: Lead title/description
        client: Associated client
        assigned_to: Employee responsible for this lead
        value: Estimated deal value
        stage: Current stage in the sales pipeline
        probability: Win probability percentage (0-100)
        expected_close_date: When we expect to close this deal
        created_at: When the lead was created
    """
    
    class Stage(models.TextChoices):
        """Sales pipeline stages."""
        NEW = 'NEW', _('New')
        CONTACTED = 'CONTACTED', _('Contacted')
        QUALIFIED = 'QUALIFIED', _('Qualified')
        PROPOSAL = 'PROPOSAL', _('Proposal Sent')
        NEGOTIATION = 'NEGOTIATION', _('Negotiation')
        WON = 'WON', _('Closed Won')
        LOST = 'LOST', _('Closed Lost')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='leads')
    title = models.CharField(max_length=200, help_text="Lead title/description")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='leads')
    assigned_to = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads', help_text="Assigned salesperson")
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Estimated deal value")
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.NEW)
    probability = models.IntegerField(default=0, help_text="Win probability (0-100%)")
    expected_close_date = models.DateField(null=True, blank=True, help_text="Expected closing date")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Lead"
        verbose_name_plural = "Leads"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'stage']),
            models.Index(fields=['assigned_to']),
        ]

    def __str__(self) -> str:
        return self.title
    
    @property
    def is_won(self) -> bool:
        """Check if lead was won."""
        return self.stage == self.Stage.WON
    
    @property
    def is_active(self) -> bool:
        """Check if lead is still active (not won or lost)."""
        return self.stage not in [self.Stage.WON, self.Stage.LOST]

class Interaction(models.Model):
    """
    Interaction model tracking communications with leads.
    
    Records all touchpoints (calls, emails, meetings) with potential customers.
    
    Attributes:
        tenant: Organization this interaction belongs to
        lead: Associated lead
        type: Type of interaction (call, email, meeting, note)
        summary: Description of what was discussed
        created_by: User who logged this interaction
        created_at: When the interaction occurred
    """
    
    class Type(models.TextChoices):
        """Interaction types."""
        CALL = 'CALL', _('Call')
        EMAIL = 'EMAIL', _('Email')
        MEETING = 'MEETING', _('Meeting')
        NOTE = 'NOTE', _('Note')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='interactions')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interactions')
    type = models.CharField(max_length=20, choices=Type.choices)
    summary = models.TextField(help_text="Interaction summary/notes")
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Interaction"
        verbose_name_plural = "Interactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lead', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.type} - {self.lead.title}"
