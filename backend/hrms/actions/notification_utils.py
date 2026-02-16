"""
Notification utility functions for triggering notifications
"""
from hrms.models import Notification, Employee

def create_notification(tenant, user, notification_type, title, message):
    """
    Create a notification for a user
    
    Args:
        tenant: Tenant instance
        user: User instance to notify
        notification_type: SUCCESS, INFO, WARNING, ERROR
        title: Notification title
        message: Notification message
    """
    Notification.objects.create(
        tenant=tenant,
        user=user,
        notification_type=notification_type,
        title=title,
        message=message
    )

def notify_leave_decision(leave_request, decision):
    """Notify employee of leave decision"""
    status_map = {
        'APPROVED': 'SUCCESS',
        'REJECTED': 'WARNING'
    }
    
    create_notification(
        tenant=leave_request.tenant,
        user=leave_request.employee.user,
        notification_type=status_map.get(decision, 'INFO'),
        title=f'Leave Request {decision}',
        message=f'Your leave from {leave_request.start_date} to {leave_request.end_date} has been {decision.lower()}.'
    )

def notify_payslip_generated(payslip):
    """Notify employee that payslip is ready"""
    create_notification(
        tenant=payslip.tenant,
        user=payslip.employee.user,
        notification_type='SUCCESS',
        title='Payslip Generated',
        message=f'Your payslip for {payslip.payroll_run.month.strftime("%B %Y")} is now available.'
    )

def notify_appraisal_assigned(review):
    """Notify employee of new appraisal assignment"""
    create_notification(
        tenant=review.tenant,
        user=review.employee.user,
        notification_type='INFO',
        title='Appraisal Cycle Started',
        message=f'Your appraisal for {review.appraisal_cycle.name} has been initiated. Please complete your self-assessment.'
    )

def notify_goal_assigned(goal):
    """Notify employee of new goal"""
    create_notification(
        tenant=goal.tenant,
        user=goal.employee.user,
        notification_type='INFO',
        title='New Goal Assigned',
        message=f'Goal "{goal.title}" has been assigned to you. Target date: {goal.target_date}'
    )

def notify_ticket_assigned(ticket):
    """Notify support team of new ticket"""
    # For simplicity, notify the requester
    create_notification(
        tenant=ticket.tenant,
        user=ticket.requester,
        notification_type='INFO',
        title='Support Ticket Created',
        message=f'Your ticket "{ticket.title}" has been created. Ticket ID: #{ticket.id}'
    )

def notify_ticket_status_change(ticket, new_status):
    """Notify requester of ticket status change"""
    create_notification(
        tenant=ticket.tenant,
        user=ticket.requester,
        notification_type='INFO',
        title='Ticket Status Updated',
        message=f'Your ticket #{ticket.id} status changed to {new_status}'
    )

def notify_asset_assigned(allocation):
    """Notify employee of asset assignment"""
    create_notification(
        tenant=allocation.tenant,
        user=allocation.employee.user,
        notification_type='SUCCESS',
        title='Asset Assigned',
        message=f'Asset "{allocation.asset.name}" has been assigned to you.'
    )

def notify_offboarding_approved(offboarding):
    """Notify employee of offboarding approval"""
    create_notification(
        tenant=offboarding.tenant,
        user=offboarding.employee.user,
        notification_type='INFO',
        title='Offboarding Request Approved',
        message=f'Your resignation/offboarding request has been approved. Please complete clearance procedures.'
    )

def notify_application_stage_change(application):
    """Notify candidate of stage change (via email usually but here system notification if they are user)"""
    # Candidates may NOT be users yet, so this might check if they have a user account
    # For now, let's assume we notify the recruiter or the candidate if they are internal
    # If candidate is external, we can't create Notification object for them unless we have a User.
    # So this might only work if we made a user for them?
    # Actually, let's notify the RECRUITER (owner of job) about stage change for now?
    # Or if we have an internal candidate.
    
    # If candidate has a user account (e.g. internal application or portal user)
    # Check if candidate email matches any user
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(email=application.candidate.email, tenant=application.tenant)
        create_notification(
            tenant=application.tenant,
            user=user,
            notification_type='INFO',
            title='Job Application Update',
            message=f'Your application for {application.job.title} has moved to {application.current_stage}.'
        )
    except User.DoesNotExist:
        pass

def notify_leave_created(leave_request):
    """Notify manager/admin of new leave request"""
    # 1. Notify Reporting Manager
    notified = False
    if leave_request.employee.reporting_manager and leave_request.employee.reporting_manager.user:
        create_notification(
            tenant=leave_request.tenant,
            user=leave_request.employee.reporting_manager.user,
            notification_type='INFO',
            title='New Leave Request',
            message=f'{leave_request.employee.get_full_name()} has requested leave from {leave_request.start_date} to {leave_request.end_date}.'
        )
        notified = True
    
    # 2. If no manager, notify Admins
    if not notified:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Find admins for this tenant
        admins = User.objects.filter(tenant=leave_request.tenant, role='Admin')
        for admin in admins:
            create_notification(
                tenant=leave_request.tenant,
                user=admin,
                notification_type='WARNING',
                title='New Leave Request (No Manager)',
                message=f'{leave_request.employee.get_full_name()} has requested leave. Please assign a reporting manager.'
            )
