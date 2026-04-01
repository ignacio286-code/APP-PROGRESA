#!/bin/bash
# Setup cron jobs for automated report sending
# Run analytics report cron every day at 8am (checks for due ReportSchedule records)
(crontab -l 2>/dev/null; echo "0 8 * * * curl -s https://app.agencia-de-marketing.cl/api/cron/reports?key=CRON_SECRET_KEY_2026 > /dev/null") | crontab -
# Run social media report cron every day at 9am (checks for ReportConfig where dayOfMonth = today)
(crontab -l 2>/dev/null; echo "0 9 * * * curl -s https://app.agencia-de-marketing.cl/api/cron/social-reports?key=CRON_SECRET_KEY_2026 > /dev/null") | crontab -
echo "Cron jobs configured successfully"
echo "Current crontab:"
crontab -l
