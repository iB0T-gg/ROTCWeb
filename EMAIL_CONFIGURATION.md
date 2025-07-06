# Email Configuration Guide - Fix All Email Issues

## Step 1: Create/Update Your .env File

Create a `.env` file in your project root with the following email configuration:

```env
# App Configuration
APP_NAME="ROTC Webpage"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rotc_webpage
DB_USERNAME=root
DB_PASSWORD=

# Email Configuration for Mailtrap
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=d6143874ec41e0
MAIL_PASSWORD=****a9ea
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@rotc-webpage.com"
MAIL_FROM_NAME="ROTC Webpage"

# Session and Cache
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

## Step 2: Generate Application Key

Run this command to generate your application key:

```bash
php artisan key:generate
```

## Step 3: Set Up Mailtrap

1. Go to [Mailtrap.io](https://mailtrap.io) and create a free account
2. Click on your default inbox
3. Click "Show Credentials" 
4. Copy the SMTP settings:
   - Username: Your Mailtrap username
   - Password: Your Mailtrap password
   - Host: smtp.mailtrap.io
   - Port: 2525

5. Replace `your_mailtrap_username` and `your_mailtrap_password` in your `.env` file

## Step 4: Run Database Migrations

```bash
php artisan migrate
```

## Step 5: Seed the Database

```bash
php artisan db:seed
```

## Step 6: Test Email Configuration

Visit this URL to test if emails are working:
```
http://localhost:8000/test-email
```

You should see "Email sent successfully!" if the configuration is correct.

## Step 7: Test Password Reset

1. Go to the login page
2. Click "Forgot Password?"
3. Enter an email address that exists in your database
4. Submit the form
5. Check your Mailtrap inbox for the password reset email

## Troubleshooting Common Issues

### Issue 1: "Email sent successfully!" but no email in Mailtrap
- Check your Mailtrap credentials in `.env`
- Make sure you're looking at the correct inbox in Mailtrap
- Check if emails are in the spam folder

### Issue 2: "Email failed" error
- Verify your `.env` file exists and has correct values
- Make sure you've run `php artisan key:generate`
- Check that Mailtrap credentials are correct

### Issue 3: Password reset link doesn't work
- Make sure the `APP_URL` in `.env` matches your local development URL
- Check that the reset token hasn't expired (60 minutes by default)

### Issue 4: User not found error
- Make sure the user exists in the database
- Run `php artisan db:seed` to create test users

## Production Email Setup

When moving to production, replace Mailtrap with:

### Option 1: Gmail SMTP
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

### Option 2: SendGrid
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
```

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific email configurations
- Consider using email queues for better performance in production
- Regularly rotate email service credentials

## Complete Testing Checklist

- [ ] `.env` file created with correct email settings
- [ ] Application key generated
- [ ] Database migrated and seeded
- [ ] Test email route works (`/test-email`)
- [ ] Password reset form submits without errors
- [ ] Password reset email received in Mailtrap
- [ ] Password reset link works and allows password change
- [ ] User can log in with new password 