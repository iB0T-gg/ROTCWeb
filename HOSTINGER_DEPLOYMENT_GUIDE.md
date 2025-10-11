# Hostinger Deployment Guide

## File Path Adjustments for Hostinger Hosting

This guide explains the changes made to adjust file paths for Hostinger hosting and how to properly deploy your ROTC webpage application.

## Changes Made

### 1. Filesystem Configuration (`config/filesystems.php`)
- Updated the public disk URL from `/storage` to `/public/storage`
- Added additional symbolic link configuration for Hostinger's directory structure

### 2. UserController (`app/Http/Controllers/UserController.php`)
- Updated avatar file paths from `/storage/` to `/public/storage/`

### 3. Frontend Components
- **Header Component** (`resources/js/components/header.jsx`): Updated profile picture paths
- **User Sidebar** (`resources/js/components/userSidebar.jsx`): Updated profile picture paths  
- **Admin Permission** (`resources/js/pages/admin/adminPermission.jsx`): Updated certificate file paths

## Directory Structure on Hostinger

Based on your file browser image, the structure should be:
```
public_html/
├── web/
│   ├── public/
│   │   ├── storage/ (symbolic link to storage/app/public)
│   │   └── ...
│   └── storage/
│       ├── app/
│       │   └── public/
│       │       ├── avatars/
│       │       ├── cor_files/
│       │       └── credentials_files/
│       └── ...
```

## Deployment Steps

### 1. Upload Your Application
Upload your Laravel application to the `public_html/web/` directory on Hostinger.

### 2. Run the Setup Script
Execute the setup script on your Hostinger server:
```bash
php setup_hostinger_storage.php
```

### 3. Manual Setup (if script fails)
If the automated script doesn't work, manually create the symbolic link:
```bash
cd public_html/web
ln -s storage/app/public public/storage
```

### 4. Set Permissions
Ensure proper permissions are set:
```bash
chmod -R 755 storage/
chmod -R 755 public/storage/
```

### 5. Test File Uploads
1. Try uploading a profile picture
2. Try uploading a COR file during registration
3. Verify files are accessible via the web interface

## File Access URLs

After deployment, files will be accessible at:
- **Avatars**: `https://yourdomain.com/public/storage/avatars/filename.jpg`
- **COR Files**: `https://yourdomain.com/public/storage/cor_files/filename.pdf`
- **Credentials**: `https://yourdomain.com/public/storage/credentials_files/filename.pdf`

## Troubleshooting

### Files Not Accessible
1. Check if the symbolic link exists: `ls -la public/storage`
2. Verify permissions: `ls -la storage/app/public/`
3. Check if files are being uploaded to the correct directory

### Upload Failures
1. Check storage directory permissions
2. Verify PHP upload limits in your hosting control panel
3. Check Laravel logs for specific error messages

### Symbolic Link Issues
If symbolic links don't work on your hosting plan:
1. Contact Hostinger support to enable symbolic links
2. As an alternative, you can copy files from `storage/app/public/` to `public/storage/` after each upload

## Environment Configuration

Make sure your `.env` file has the correct APP_URL:
```env
APP_URL=https://yourdomain.com
```

## Security Notes

- The `public/storage` directory is publicly accessible
- Only upload necessary files to this directory
- Consider implementing file access controls if needed
- Regularly clean up old uploaded files

## Support

If you encounter issues:
1. Check the Laravel logs in `storage/logs/`
2. Verify file permissions and directory structure
3. Test with a simple file upload first
4. Contact Hostinger support if symbolic links are not supported
