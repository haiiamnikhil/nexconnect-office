from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from hrms.models import Ticket, TicketComment, Employee
from hrms.data.helpdesk_serializers import TicketSerializer, TicketCommentSerializer

from hrms.permissions import HasAppPermission

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'helpdesk'

    def get_queryset(self):
        user = self.request.user
        # Admins/Support see all, Employees see their own
        # Simplification: we'll show all for now, or filter if 'my_tickets' is passed
        queryset = Ticket.objects.filter(tenant=user.tenant)
        if self.request.query_params.get('my_tickets'):
            queryset = queryset.filter(requester=user)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, tenant=self.request.user.tenant)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for a ticket"""
        ticket = self.get_object()
        comments = ticket.comments.all().order_by('created_at')
        serializer = TicketCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to the ticket"""
        ticket = self.get_object()
        serializer = TicketCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(ticket=ticket, user=request.user, tenant=request.user.tenant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update ticket status (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED)"""
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = new_status
        
        if new_status == 'RESOLVED' and not ticket.resolved_at:
            ticket.resolved_at = timezone.now()
        
        ticket.save()
        
        # Auto-add comment for status change
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            tenant=request.user.tenant,
            comment=f"Status changed from {old_status} to {new_status}"
        )
        
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark ticket as resolved"""
        ticket = self.get_object()
        ticket.status = 'RESOLVED'
        ticket.resolved_at = timezone.now()
        ticket.save()
        return Response({'status': 'Ticket Resolved'})
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close ticket (final state)"""
        ticket = self.get_object()
        if ticket.status != 'RESOLVED':
            return Response({'error': 'Ticket must be resolved before closing'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        ticket.status = 'CLOSED'
        ticket.save()
        
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            tenant=request.user.tenant,
            comment="Ticket closed"
        )
        
        return Response({'status': 'Ticket Closed'})

