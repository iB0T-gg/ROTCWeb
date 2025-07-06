<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?: 'test@example.com';
        
        $this->info('Testing email configuration...');
        $this->info('Mail Driver: ' . config('mail.default'));
        $this->info('Mail Host: ' . config('mail.mailers.smtp.host'));
        $this->info('Mail Port: ' . config('mail.mailers.smtp.port'));
        $this->info('Mail Username: ' . config('mail.mailers.smtp.username'));
        $this->info('Mail Encryption: ' . config('mail.mailers.smtp.encryption'));
        $this->info('From Address: ' . config('mail.from.address'));
        $this->info('From Name: ' . config('mail.from.name'));
        
        try {
            Mail::raw('This is a test email from ROTC Webpage. If you receive this, your email configuration is working correctly!', function ($message) use ($email) {
                $message->to($email)
                        ->subject('ROTC Webpage - Email Test')
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });
            
            $this->info('✅ Email sent successfully!');
            $this->info('Check your Mailtrap inbox or the email address you provided.');
            
        } catch (\Exception $e) {
            $this->error('❌ Email failed to send!');
            $this->error('Error: ' . $e->getMessage());
            $this->error('Please check your .env file and Mailtrap credentials.');
        }
    }
} 