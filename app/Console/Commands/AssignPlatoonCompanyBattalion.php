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

        // Separate by battalion (gender) while preserving sorted order
        $males = $cadets->filter(function ($c) {
            $g = is_string($c->gender) ? strtolower(trim($c->gender)) : '';
            return $g === 'male' || $g === 'm' || $c->battalion === '1st Battalion';
        })->values();
        $females = $cadets->filter(function ($c) {
            $g = is_string($c->gender) ? strtolower(trim($c->gender)) : '';
            return $g === 'female' || $g === 'f' || $c->battalion === '2nd Battalion';
        })->values();
        $others = $cadets->diff($males)->diff($females)->values(); // any unknowns

        $updated = 0;

        // Helper to assign platoon/company cycling every 37 and 111 respectively, starting from Alpha each phase
        $assignPhase = function ($list, $forcedBattalion) use (&$updated, $dryRun, $companies) {
            foreach ($list as $index => $cadet) {
                $groupIndex = intdiv($index, 37); // 0-based groups of 37 per phase
                $cycle = $groupIndex % 3; // 0,1,2 => 1st/2nd/3rd platoon
                $platoon = $cycle === 0 ? '1st Platoon' : ($cycle === 1 ? '2nd Platoon' : '3rd Platoon');
                // Company advances only after a full cycle of three platoons (every 111 cadets)
                $companyIndex = intdiv($groupIndex, 3);
                $company = $companies[$companyIndex % count($companies)];

                $battalion = $forcedBattalion; // '1st Battalion' or '2nd Battalion'

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
        };

        // Phase 1: all males (1st Battalion), starting from Alpha
        $assignPhase($males, '1st Battalion');
        // Phase 2: all females (2nd Battalion), starting from Alpha
        $assignPhase($females, '2nd Battalion');
        // Phase 3: any unknown gender/battalion - keep existing battalion, still cycle from Alpha
        $assignPhase($others, null);

        $this->info(($dryRun ? 'Would update ' : 'Updated ') . $updated . ' cadets.');

        return Command::SUCCESS;
    }
}


