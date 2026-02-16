from django.db import models
from django.utils.translation import gettext_lazy as _

class Project(models.Model):
    """
    Project model for managing client projects and initiatives.
    
    Tracks project lifecycle from planning to completion, including client
    association, team assignment, and status monitoring.
    
    Attributes:
        tenant: Organization managing this project
        name: Project name/title
        description: Detailed project description
        client: Associated CRM client (optional)
        manager: Project manager (HRMS employee)
        start_date: Project start date
        end_date: Expected/actual completion date
        status: Current project status (PLANNING, ACTIVE, COMPLETED, ON_HOLD)
        created_at: When the project was created
    """
    class Status(models.TextChoices):
        """Project lifecycle statuses."""
        PLANNING = 'PLANNING', _('Planning')
        ACTIVE = 'ACTIVE', _('Active')
        COMPLETED = 'COMPLETED', _('Completed')
        ON_HOLD = 'ON_HOLD', _('On Hold')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200, help_text="Project name/title")
    description = models.TextField(blank=True, help_text="Detailed project description")
    client = models.ForeignKey('crm.Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects', help_text="Associated client")
    manager = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects', help_text="Project manager")
    start_date = models.DateField(help_text="Project start date")
    end_date = models.DateField(null=True, blank=True, help_text="Expected/actual completion date")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['manager']),
            models.Index(fields=['client']),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.tenant.name})"
    
    @property
    def is_active(self) -> bool:
        """Check if project is currently active."""
        return self.status == self.Status.ACTIVE
    
    @property
    def is_completed(self) -> bool:
        """Check if project is completed."""
        return self.status == self.Status.COMPLETED

class Task(models.Model):
    """
    Task model for project task management.
    
    Breaks down projects into manageable tasks with status tracking,
    assignment, and deadlines.
    
    Attributes:
        tenant: Organization this task belongs to
        project: Parent project
        title: Task title
        description: Detailed task description
        assigned_to: Employee assigned to this task
        due_date: Task deadline
        status: Current task status (TODO, IN_PROGRESS, REVIEW, DONE)
    """
    
    class Status(models.TextChoices):
        """Task workflow statuses."""
        TODO = 'TODO', _('To Do')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        REVIEW = 'REVIEW', _('Review')
        DONE = 'DONE', _('Done')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200, help_text="Task title")
    description = models.TextField(blank=True, help_text="Detailed task description")
    assigned_to = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', help_text="Assigned employee")
    due_date = models.DateField(null=True, blank=True, help_text="Task deadline")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)

    class Meta:
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ['due_date', '-id']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self) -> str:
        return self.title
    
    @property
    def is_overdue(self) -> bool:
        """Check if task is past its due date."""
        from django.utils import timezone
        return self.due_date and self.due_date < timezone.now().date() and self.status != self.Status.DONE

class InventoryItem(models.Model):
    """
    Inventory Item model for stock/asset management.
    
    Tracks inventory levels, pricing, and reorder points for business assets.
    
    Attributes:
        tenant: Organization managing this inventory
        name: Item name
        sku: Stock Keeping Unit (unique identifier)
        description: Item description
        unit_price: Price per unit
        quantity_on_hand: Current stock level
        reorder_level: Minimum quantity before reordering
        created_at: When the item was added to inventory
    """
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='inventory_items')
    name = models.CharField(max_length=200, help_text="Item name")
    sku = models.CharField(max_length=50, help_text="Stock Keeping Unit")  # Stock Keeping Unit
    description = models.TextField(blank=True, help_text="Item description")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price per unit")
    quantity_on_hand = models.IntegerField(default=0, help_text="Current stock level")
    reorder_level = models.IntegerField(default=10, help_text="Minimum quantity before reordering")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant', 'sku')
        verbose_name = "Inventory Item"
        verbose_name_plural = "Inventory Items"
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'sku']),
            models.Index(fields=['tenant', 'quantity_on_hand']),
        ]

    def __str__(self) -> str:
        return self.name
    
    @property
    def needs_reorder(self) -> bool:
        """Check if item quantity is at or below reorder level."""
        return self.quantity_on_hand <= self.reorder_level
    
    @property
    def total_value(self) -> float:
        """Calculate total inventory value for this item."""
        return float(self.unit_price * self.quantity_on_hand)

class StockTransaction(models.Model):
    """
    Stock Transaction model for tracking inventory movements.
    
    Records all stock in/out transactions and automatically updates
    inventory quantities on creation.
    
    Attributes:
        tenant: Organization this transaction belongs to
        item: Inventory item being transacted
        transaction_type: IN (stock received) or OUT (stock issued)
        quantity: Number of units transacted
        reason: Explanation for the transaction
        created_at: When the transaction occurred
        created_by: User who recorded this transaction
    """
    
    class Type(models.TextChoices):
        """Transaction types."""
        IN = 'IN', _('Stock In')
        OUT = 'OUT', _('Stock Out')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='stock_transactions')
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=Type.choices, help_text="IN (received) or OUT (issued)")
    quantity = models.IntegerField(help_text="Number of units")
    reason = models.TextField(blank=True, help_text="Transaction reason/notes")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = "Stock Transaction"
        verbose_name_plural = "Stock Transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['item', '-created_at']),
            models.Index(fields=['tenant', 'transaction_type']),
        ]

    def __str__(self) -> str:
        return f"{self.get_transaction_type_display()} - {self.item.name} ({self.quantity})"

    def save(self, *args, **kwargs):
        """
        Save transaction and update inventory quantity.
        
        Automatically adjusts inventory item quantity based on transaction type.
        Only updates quantity on creation to prevent double-counting.
        """
        # Update inventory quantity (only on create)
        if not self.pk:  # Only on create
            if self.transaction_type == self.Type.IN:
                self.item.quantity_on_hand += self.quantity
            elif self.transaction_type == self.Type.OUT:
                self.item.quantity_on_hand -= self.quantity
            self.item.save()
        super().save(*args, **kwargs)
