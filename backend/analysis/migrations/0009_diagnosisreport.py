from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("analysis", "0008_notification"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DiagnosisReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(blank=True, max_length=200)),
                ("report_file", models.FileField(upload_to="patients/diagnosis_reports/%Y/%m/%d/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="diagnosis_reports_created", to=settings.AUTH_USER_MODEL)),
                ("diagnosis", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="saved_reports", to="analysis.diagnosisresult")),
                ("patient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="diagnosis_reports", to="analysis.patient")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
