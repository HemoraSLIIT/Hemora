# Generated migration for DiagnosisJob model

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('analysis', '0002_latest'),  # Update this to match your latest migration
    ]

    operations = [
        migrations.CreateModel(
            name='DiagnosisJob',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('running', 'Running'), ('succeeded', 'Succeeded'), ('failed', 'Failed')],
                    default='pending',
                    max_length=20
                )),
                ('cbc_parameters', models.JSONField(default=dict)),
                ('analysis_method', models.CharField(
                    choices=[('cbc_only', 'CBC Only'), ('hybrid', 'Hybrid')],
                    default='hybrid',
                    max_length=20
                )),
                ('result_json', models.JSONField(blank=True, default=dict)),
                ('error_message', models.TextField(blank=True)),
                ('error_code', models.CharField(blank=True, max_length=50)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('retry_count', models.PositiveIntegerField(db_index=True, default=0)),
                ('max_retries', models.PositiveIntegerField(default=3)),
                ('next_retry_at', models.DateTimeField(blank=True, null=True)),
                ('correlation_id', models.CharField(blank=True, db_index=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='diagnosis_jobs', to='analysis.patient')),
            ],
            options={
                'ordering': ['-requested_at'],
            },
        ),
        migrations.AddIndex(
            model_name='diagnosisjob',
            index=models.Index(fields=['status', 'updated_at'], name='analysis_di_status_idx'),
        ),
        migrations.AddIndex(
            model_name='diagnosisjob',
            index=models.Index(fields=['patient', 'status'], name='analysis_di_patient_idx'),
        ),
        migrations.AddIndex(
            model_name='diagnosisjob',
            index=models.Index(fields=['retry_count', 'status'], name='analysis_di_retry_idx'),
        ),
    ]
