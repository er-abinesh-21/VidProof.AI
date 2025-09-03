# Supabase Storage Configuration for Large Files (500MB)

## Important: Server-Side Configuration Required

To enable 500MB file uploads, you need to configure your Supabase project settings. The client-side code has been updated, but Supabase has server-side limits that must be adjusted.

## Steps to Enable 500MB Uploads:

### 1. Update Supabase Storage Bucket Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click on your `videos` bucket
5. Click on **Policies** tab
6. Update or create policies with the following settings:

### 2. Configure File Size Limit

In your Supabase dashboard:
1. Go to **Settings** → **Storage**
2. Update the following settings:
   - **Max file size**: Set to `524288000` (500MB in bytes)
   - **Request body limit**: Set to `524288000`

### 3. Update Bucket Configuration

```sql
-- Run this in your Supabase SQL Editor
UPDATE storage.buckets 
SET file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
WHERE name = 'videos';
```

### 4. For Supabase Pro/Team Plans

If you're on a Pro or Team plan, you can request higher limits:
1. Go to **Settings** → **General**
2. Contact support to increase the global file upload limit
3. Request to increase the limit to 500MB

### 5. Alternative: Use Supabase Resumable Uploads

For files larger than 100MB, Supabase recommends using their resumable upload feature:

```javascript
// This is already implemented in src/lib/supabase.ts
const { data, error } = await supabase.storage
  .from('videos')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    duplex: 'half' // Required for large files
  });
```

## Current Limitations

- **Free Tier**: Limited to 50MB per file
- **Pro Tier**: Can be configured up to 5GB per file
- **Team/Enterprise**: Custom limits available

## Troubleshooting

If you're still experiencing issues:

1. Check browser console for specific error messages
2. Verify your Supabase plan supports the file size
3. Ensure your network connection is stable for large uploads
4. Consider implementing chunked uploads for better reliability

## Testing

After configuration:
1. Try uploading a small file first (< 10MB)
2. Gradually increase file size to test limits
3. Monitor the browser console for any errors

## Contact Support

If you need to increase limits beyond default settings:
- Email: support@supabase.io
- Include your project reference ID
- Specify the required file size limit (500MB)
