<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:reset';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset database and seed with fresh data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->confirm('This will delete all data and reset the database. Are you sure?')) {
            $this->info('Resetting database...');
            
            // Drop all tables
            Schema::dropIfExists('users');
            Schema::dropIfExists('password_reset_tokens');
            Schema::dropIfExists('sessions');
            Schema::dropIfExists('cache');
            Schema::dropIfExists('jobs');
            
            $this->info('Tables dropped successfully.');
            
            // Run migrations
            $this->call('migrate');
            $this->info('Migrations completed.');
            
            // Run seeders
            $this->call('db:seed');
            $this->info('Database seeded successfully.');
            
            $this->info('✅ Database reset completed!');
            $this->info('Admin credentials: admin@example.com / admin@123');
            $this->info('Test user credentials: test@example.com / password');
        } else {
            $this->info('Database reset cancelled.');
        }
    }
} 