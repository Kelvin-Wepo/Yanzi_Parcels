from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from  django.conf import settings
from core.models import *


@login_required(login_url="/sign-in/?next=courier/")
def home(request):
    return redirect(reverse('courier:available_jobs'))


@login_required(login_url="/sign-in/?next=courier/")
def available_jobs_page(request):
    return render(request, 'courier/available_jobs.html', {
        "GOOGLE_MAP_API_KEY":settings.GOOGLE_MAP_API_KEY
    })

@login_required(login_url="/sign-in/?next=courier/")
def available_job_page(request, id):
    job=Job.objects.filter(id=id,status=Job.PROCESSING_STATUS).last()


    if not job:
        return redirect(reverse('courier:available_jobs'))
    
    if request.method == 'POST':
        job.courier = request.user.courier
        job.status = Job.PICKING_STATUS
        job.save()
    
    return redirect(reverse('courier:available_jobs'))

    return render(request, 'courier/available_jobs.html',{
        "job":job
    })
@login_required(login_url="/sign-in/?next=courier/")
def current_job__page(request):
    job = Job.objects.filter(
        courier=request.user.courier,
        status__in=[
            Job.PICKING_STATUS,
            Job.DELIVERING_STATUS,  # Add a comma here
        ]
    ).last()

    return render(request, 'courier/current_job.html', {
        "job": job,
        "GOOGLE_MAP_API_KEY": settings.GOOGLE_MAP_API_KEY  # Fix the typo here
    })
