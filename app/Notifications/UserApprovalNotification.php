<?php
/**
 * UserApprovalNotification
 * 
 * This notification is sent to users when their registration is approved or rejected.
 * It sends an email with different content based on the approval status.
 */

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * User Approval Notification
 * 
 * Sends email notifications to users when their account status changes
 * (either approved or rejected by an administrator).
 */
class UserApprovalNotification extends Notification
{
    use Queueable;

    protected $status;
    protected $user;

    /**
     * Create a new notification instance.
     */
    public function __construct($status, $user)
    {
        $this->status = $status;
        $this->user = $user;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        if ($this->status === 'approved') {
            return (new MailMessage)
                ->subject('Account Approved - ROTC Portal')
                ->greeting('Hello ' . $this->user->first_name . '!')
                ->line('Your account has been approved by the administrator.')
                ->line('You can now log in to your account using your email and the password you created during registration.')
                ->action('Login Now', url('/'))
                ->line('Welcome to the ROTC Portal!')
                ->line('If you have any questions or need assistance, please contact the administrator.');
        } else {
            return (new MailMessage)
                ->subject('Account Status Update - ROTC Portal')
                ->greeting('Hello ' . $this->user->first_name . '!')
                ->line('Your account registration has been reviewed.')
                ->line('Unfortunately, your account has not been approved at this time.')
                ->line('If you believe this is an error, please contact the administrator.')
                ->line('Thank you for your interest in ROTC Portal.');
        }
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'status' => $this->status,
            'user_id' => $this->user->id,
        ];
    }
} 