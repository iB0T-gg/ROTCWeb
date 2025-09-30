<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoginCredentialsNotification extends Notification
{
    use Queueable;

    protected $user;
    protected $password;

    /**
     * Create a new notification instance.
     */
    public function __construct($user, $password)
    {
        $this->user = $user;
        $this->password = $password;
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
        $roleDisplayName = $this->getRoleDisplayName($this->user->role);
        
        return (new MailMessage)
            ->subject('Welcome to ROTC Portal - Your Account is Ready!')
            ->greeting('Welcome ' . $this->user->first_name . '!')
            ->line('Your account has been approved and is now ready to use.')
            ->line('Your account details:')
            ->line('**Role:** ' . $roleDisplayName)
            ->line('**Email:** ' . $this->user->email)
            ->line('**Password:** ' . $this->password)
            ->line('')
            ->line('**IMPORTANT: Please change your password after your first login for security purposes.**')
            ->action('Login Now', url('/'))
            ->line('If you have any questions or need assistance, please contact the administrator.')
            ->line('Welcome to the ROTC Portal!');
    }

    /**
     * Get display name for role
     */
    private function getRoleDisplayName($role)
    {
        switch ($role) {
            case 'user':
                return 'Cadet';
            case 'faculty':
                return 'Faculty Member';
            case 'admin':
                return 'Administrator';
            default:
                return ucfirst($role);
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
            'user_id' => $this->user->id,
            'role' => $this->user->role,
        ];
    }
}