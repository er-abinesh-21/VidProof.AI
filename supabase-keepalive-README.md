# Supabase Keepalive Setup

This workflow ensures your Supabase instance stays active by pinging it every 12 hours. Free Supabase projects are paused after 2 days of inactivity.

## Setup Instructions

1. **Add Supabase URL to GitHub Secrets**
   - Go to your GitHub repository
   - Navigate to Settings > Secrets > Actions
   - Click "New repository secret"
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

2. **Verify Workflow**
   - The workflow will run automatically every 12 hours
   - You can also trigger it manually from the Actions tab

## How It Works

- The workflow runs on a schedule (every 12 hours)
- It makes a simple HTTP GET request to your Supabase URL
- This keeps the instance active and prevents it from pausing

## Troubleshooting

If the workflow fails:
1. Check that the `SUPABASE_URL` secret is correctly set
2. Verify the URL is accessible from the internet
3. Check the workflow logs for any error messages
