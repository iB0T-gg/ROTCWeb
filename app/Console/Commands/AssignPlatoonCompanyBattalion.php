<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class AssignPlatoonCompanyBattalion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cadets:assign-pcb {--dry-run : Show planned changes without saving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate and assign platoon, company, and battalion for all approved cadets.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('Loading approved cadets...');
        $cadets = User::where('role', 'user')
            ->where('status', 'approved')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        if ($cadets->isEmpty()) {
            $this->warn('No approved cadets found.');
            return Command::SUCCESS;
        }

        $companies = ['Alpha','Beta','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'];

        $updated = 0;
        foreach ($cadets as $index => $cadet) {
            $groupIndex = intdiv($index, 37); // 0-based groups of 37
            $cycle = $groupIndex % 3; // platoon cycle: 0,1,2 => 1st/2nd/3rd
            $platoon = $cycle === 0 ? '1st Platoon' : ($cycle === 1 ? '2nd Platoon' : '3rd Platoon');
            // Company advances only after a full cycle of three platoons (every 111 cadets)
            $companyIndex = intdiv($groupIndex, 3);
            $company = $companies[$companyIndex % count($companies)];
            // Battalion by gender (case-insensitive; supports short forms 'M'/'F')
            $gender = is_string($cadet->gender) ? strtolower(trim($cadet->gender)) : '';
            if ($gender === 'male' || $gender === 'm') {
                $battalion = '1st Battalion';
            } elseif ($gender === 'female' || $gender === 'f') {
                $battalion = '2nd Battalion';
            } else {
                $battalion = $cadet->battalion; // leave as is if unknown
            }

            if ($dryRun) {
                $this->line(sprintf('%s, %s -> %s | %s | %s', $cadet->last_name, $cadet->first_name, $platoon, $company, $battalion ?? '-'));
                $updated++;
                continue;
            }

            $cadet->platoon = $platoon;
            $cadet->company = $company;
            if ($battalion !== null) {
                $cadet->battalion = $battalion;
            }
            $cadet->save();
            $updated++;
        }

        $this->info(($dryRun ? 'Would update ' : 'Updated ') . $updated . ' cadets.');

        return Command::SUCCESS;
    }
}


