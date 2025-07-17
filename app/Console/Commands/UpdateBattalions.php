<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class UpdateBattalions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-battalions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update all users battalion based on gender (Male=1st, Female=2nd)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating battalion values to match UI...');
        $updated = 0;
        $users = \App\Models\User::where('battalion', '1st')->orWhere('battalion', '2nd')->get();
        foreach ($users as $user) {
            if ($user->battalion === '1st') {
                $user->battalion = '1st Battalion';
            } elseif ($user->battalion === '2nd') {
                $user->battalion = '2nd Battalion';
            }
            $user->save();
            $updated++;
        }
        $this->info("Updated {$updated} users' battalion values.");
    }
}
