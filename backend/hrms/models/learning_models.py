from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CourseCategory(models.Model):
    """
    Category for grouping courses (e.g., "Technical", "Soft Skills", "Compliance")
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='course_categories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Course Categories"
        unique_together = ['tenant', 'name']

    def __str__(self):
        return self.name

class Course(models.Model):
    """
    Main Course Model
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True, related_name='courses')
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    
    # Instructor/Creator
    instructor = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, related_name='structured_courses')
    
    # Metadata
    is_mandatory = models.BooleanField(default=False, help_text="Is this mandatory compliance training?")
    estimated_duration = models.IntegerField(help_text="Estimated duration in minutes", default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='courses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class CourseModule(models.Model):
    """
    A section or chapter within a course
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    """
    Individual content unit (Video, Text, Quiz link)
    """
    TYPE_CHOICES = [
        ('VIDEO', 'Video'),
        ('ARTICLE', 'text/Article'),
        ('QUIZ', 'Quiz/Assessment'),
    ]

    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='ARTICLE')
    
    # Content fields
    video_url = models.URLField(blank=True, help_text="YouTube/Vimeo link or internal URL")
    text_content = models.TextField(blank=True, help_text="Markdown supported")
    duration_minutes = models.IntegerField(default=10)
    
    order = models.IntegerField(default=1)
    is_preview = models.BooleanField(default=False, help_text="Allow preview before enrollment?")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

class Enrollment(models.Model):
    """
    Employee enrollment in a course
    """
    STATUS_CHOICES = [
        ('ENROLLED', 'Enrolled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ENROLLED')
    progress_percentage = models.IntegerField(default=0)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)

    class Meta:
        unique_together = ['employee', 'course']

    def __str__(self):
        return f"{self.employee} - {self.course}"

class LessonProgress(models.Model):
    """
    Track completion of individual lessons
    """
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['enrollment', 'lesson']

    def __str__(self):
        return f"{self.enrollment} - {self.lesson}"
