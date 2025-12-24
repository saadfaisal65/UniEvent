# Vercel Deployment Guide

## Required Environment Variables

When deploying to Vercel, you **must** set the following environment variables in your Vercel project settings:

### Navigate to: Project Settings → Environment Variables

Add these variables:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events
NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID=societies
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=event-posters
```

### How to Get Your IDs:

1. **Project ID**: 
   - Go to [Appwrite Console](https://cloud.appwrite.io)
   - Select your project
   - Copy the Project ID from the top of the page

2. **Database ID**:
   - In your Appwrite project, go to "Databases"
   - Copy the Database ID (or create one if needed)

3. **Collection IDs**: 
   - Use the values shown above (they match your `init-appwrite.mjs` script)

## Common Issues

### Network Error on Signup

**Symptom**: "NetworkError when attempting to fetch resource" when creating an account

**Causes**:
1. ✗ Environment variables not set on Vercel
2. ✗ Appwrite endpoint not accessible
3. ✗ CORS not configured in Appwrite

**Solutions**:

#### 1. Verify Environment Variables
- Check that ALL variables are set in Vercel dashboard
- Redeploy after adding variables

#### 2. Configure Appwrite CORS
In your Appwrite Console:
- Go to Project Settings → Platforms
- Add your Vercel domain (e.g., `your-app.vercel.app`)
- Add `localhost:3000` for local development

#### 3. Check Appwrite Status
- Ensure your Appwrite instance is running
- Test the endpoint in your browser: `https://cloud.appwrite.io/v1/health`

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Set Environment Variables**:
   - Before deploying, add all environment variables listed above
   - Click "Deploy"

4. **Configure Appwrite**:
   - Add your Vercel URL to Appwrite platforms
   - Format: `https://your-app.vercel.app`

5. **Test**:
   - Visit your deployed app
   - Try creating an account
   - Check browser console for any errors

## Troubleshooting

If you still see network errors:

1. **Check Browser Console**: Look for specific error messages
2. **Check Vercel Logs**: Go to your deployment → Functions → View logs
3. **Verify Appwrite**: Test API calls directly using Postman or curl
4. **Check Network Tab**: See if requests are reaching Appwrite

## Need Help?

- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure your Appwrite project allows requests from your Vercel domain
