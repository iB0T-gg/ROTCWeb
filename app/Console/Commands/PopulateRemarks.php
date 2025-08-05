<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class PopulateRemarks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'populate:remarks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate remarks field for existing users based on their equivalent grades';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to populate remarks for users...');
        
        $users = User::where('role', 'user')->get();
        $updatedCount = 0;
        
        foreach ($users as $user) {
            if ($user->equivalent_grade !== null) {
                $remarks = $user->getRemarks($user->equivalent_grade);
                $user->update(['remarks' => $remarks]);
                $updatedCount++;
                $this->line("Updated user {$user->first_name} {$user->last_name}: {$user->equivalent_grade} -> {$remarks}");
            }
        }
        
        $this->info("Successfully updated remarks for {$updatedCount} users.");
        
        return 0;
    }
}
