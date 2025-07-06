# Email Setup Guide for ROTC Webpage

This guide will help you configure email functionality using Mailtrap for testing purposes.

## Step 1: Create a Mailtrap Account

1. Go to [Mailtrap.io](https://mailtrap.io) and create a free account
2. After logging in, you'll see your default inbox
3. Click on your inbox to access the SMTP settings

## Step 2: Configure Your .env File

Add the following email configuration to your `.env` file:

```env
# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@rotc-webpage.com"
MAIL_FROM_NAME="ROTC Webpage"
```

## Step 3: Get Your Mailtrap Credentials

1. In your Mailtrap inbox, click on "Show Credentials"
2. Copy the following values:
   - **Username**: Your Mailtrap username
   - **Password**: Your Mailtrap password
   - **Host**: smtp.mailtrap.io
   - **Port**: 2525

3. Replace `your_mailtrap_username` and `your_mailtrap_password` in your `.env` file with the actual values from Mailtrap.

## Step 4: Test Email Functionality

After setting up the configuration:

1. **Run the migration** (if not already done):
   ```bash
   php artisan migrate
   ```

2. **Seed the database** to create the admin account:
   ```bash
   php artisan db:seed
   ```

3. **Test the email system**:
   - Register a new user account
   - Log in as admin and approve/reject the user
   - Check your Mailtrap inbox for the notification emails

## Email Features

The system now includes the following email functionality:

1. **Password Reset Emails**: Users can request password reset links
2. **Account Approval Notifications**: Users receive emails when their account is approved
3. **Account Rejection Notifications**: Users receive emails when their account is rejected

## Troubleshooting

If emails are not being sent:

1. **Check your .env file**: Make sure all email settings are correct
2. **Verify Mailtrap credentials**: Ensure username and password are correct
3. **Check Laravel logs**: Look at `storage/logs/laravel.log` for any email errors
4. **Test with a simple email**: You can test the email configuration using Laravel's built-in mail testing

## Production Setup

When moving to production, replace Mailtrap with a real email service like:
- Gmail SMTP
- SendGrid
- Mailgun
- Amazon SES

Update the `.env` file with the production email service credentials.

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific email configurations
- Consider using email queues for better performance in production 