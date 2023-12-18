from django import forms
from django.contrib.auth.models import User
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Submit
from core.models import Customer, Job

class BasicUserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('first_name', 'last_name')

class BasicCustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ('avatar',)

class JobCreateStep1Form(forms.ModelForm):
    class Meta:
        model = Job
        fields = ('name', 'description', 'category', 'size', 'quantity', 'photo')

class JobCreateStep2Form(forms.ModelForm):
    pickup_address = forms.CharField(required=True)
    pickup_name = forms.CharField(required=True)
    pickup_phone = forms.CharField(required=True)

    class Meta:
        model = Job
        fields = ('pickup_address', 'pick_lat', 'pick_up', 'pickup_name', 'pickup_phone')

    def __init__(self, *args, **kwargs):
        super(JobCreateStep2Form, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.layout = Layout(
            'pickup_address',
            'pick_lat',
            'pick_up',
            'pickup_name',
            'pickup_phone',
            Submit('submit', 'Next')
        )

class JobCreateStep3Form(forms.ModelForm):
    delivery_address = forms.CharField(required=True)
    delivery_name = forms.CharField(required=True)
    delivery_phone = forms.CharField(required=True)

    class Meta:
        model = Job
        fields = ('delivery_address', 'delivery_lat', 'delivery_lng', 'delivery_name', 'delivery_phone')

    def __init__(self, *args, **kwargs):
        super(JobCreateStep3Form, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.layout = Layout(
            'delivery_address',
            'delivery_lat',
            'delivery_lng',
            'delivery_name',
            'delivery_phone',
            Submit('submit', 'Create Job')
        )
