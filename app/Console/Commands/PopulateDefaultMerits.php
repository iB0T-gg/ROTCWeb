<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Merit;
use App\Models\SecondSemesterMerit;
use Illuminate\Support\Facades\DB;

class PopulateDefaultMerits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'merits:populate-defaults {--semester=both : first|second|both}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate default merits_array and demerits_array for cadets who don\'t have merit records yet';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $semesterOption = strtolower((string)$this->option('semester')) ?: 'both';

        $this->info('Populating default merit records for cadets...');

        // Get all cadets
        $cadets = User::where('role', 'user')->where('status', 'approved')->get();
        $this->info("Found {$cadets->count()} cadets");

        $createdCount = 0;

        if ($semesterOption === 'first' || $semesterOption === 'both') {
            $createdCount += $this->populateFirstSemester($cadets);
        }

        if ($semesterOption === 'second' || $semesterOption === 'both') {
            $createdCount += $this->populateSecondSemester($cadets);
        }

        $this->info("Created {$createdCount} default merit records");
        $this->info('Done!');

        return Command::SUCCESS;
    }

    private function populateFirstSemester($cadets): int
    {
        $this->info('Populating first semester merit records...');
        $createdCount = 0;
        $weekCount = 10;
        $semester = '2025-2026 1st semester';

        foreach ($cadets as $cadet) {
            // Check if merit record already exists
            $existingMerit = Merit::where('cadet_id', $cadet->id)
                ->where('type', 'military_attitude')
                ->where('semester', $semester)
                ->first();

            if (!$existingMerit) {
                // Create new merit record with default values
                Merit::create([
                    'cadet_id' => $cadet->id,
                    'type' => 'military_attitude',
                    'semester' => $semester,
                    'merits_week_1' => '10',
                    'merits_week_2' => '10',
                    'merits_week_3' => '10',
                    'merits_week_4' => '10',
                    'merits_week_5' => '10',
                    'merits_week_6' => '10',
                    'merits_week_7' => '10',
                    'merits_week_8' => '10',
                    'merits_week_9' => '10',
                    'merits_week_10' => '10',
                    'demerits_week_1' => '',
                    'demerits_week_2' => '',
                    'demerits_week_3' => '',
                    'demerits_week_4' => '',
                    'demerits_week_5' => '',
                    'demerits_week_6' => '',
                    'demerits_week_7' => '',
                    'demerits_week_8' => '',
                    'demerits_week_9' => '',
                    'demerits_week_10' => '',
                    'percentage' => 30.00, // 100% of 30 points since all merits are 10
                    'total_merits' => 100, // 10 weeks * 10 points
                    'aptitude_30' => 30.00, // 100 * 0.30 = 30
                    'updated_by' => 1, // System user
                    'merits_array' => json_encode(array_fill(0, $weekCount, '10')),
                    'demerits_array' => json_encode(array_fill(0, $weekCount, '')),
                ]);
                $createdCount++;
            } else {
                // Update existing record if merits_array or demerits_array is null
                $needsUpdate = false;
                $updates = [];

                if (is_null($existingMerit->merits_array)) {
                    $updates['merits_array'] = json_encode(array_fill(0, $weekCount, '10'));
                    $needsUpdate = true;
                }

                if (is_null($existingMerit->demerits_array)) {
                    $updates['demerits_array'] = json_encode(array_fill(0, $weekCount, ''));
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    $existingMerit->update($updates);
                    $createdCount++;
                }
            }
        }

        $this->info("First semester: {$createdCount} records created/updated");
        return $createdCount;
    }

    private function populateSecondSemester($cadets): int
    {
        $this->info('Populating second semester merit records...');
        $createdCount = 0;
        $weekCount = 15;
        $semester = '2025-2026 2nd semester';

        foreach ($cadets as $cadet) {
            // Check if merit record already exists
            $existingMerit = SecondSemesterMerit::where('cadet_id', $cadet->id)
                ->where('type', 'military_attitude')
                ->where('semester', $semester)
                ->first();

            if (!$existingMerit) {
                // Create new merit record with default values
                SecondSemesterMerit::create([
                    'cadet_id' => $cadet->id,
                    'type' => 'military_attitude',
                    'semester' => $semester,
                    'merits_week_1' => '10',
                    'merits_week_2' => '10',
                    'merits_week_3' => '10',
                    'merits_week_4' => '10',
                    'merits_week_5' => '10',
                    'merits_week_6' => '10',
                    'merits_week_7' => '10',
                    'merits_week_8' => '10',
                    'merits_week_9' => '10',
                    'merits_week_10' => '10',
                    'merits_week_11' => '10',
                    'merits_week_12' => '10',
                    'merits_week_13' => '10',
                    'merits_week_14' => '10',
                    'merits_week_15' => '10',
                    'demerits_week_1' => '',
                    'demerits_week_2' => '',
                    'demerits_week_3' => '',
                    'demerits_week_4' => '',
                    'demerits_week_5' => '',
                    'demerits_week_6' => '',
                    'demerits_week_7' => '',
                    'demerits_week_8' => '',
                    'demerits_week_9' => '',
                    'demerits_week_10' => '',
                    'demerits_week_11' => '',
                    'demerits_week_12' => '',
                    'demerits_week_13' => '',
                    'demerits_week_14' => '',
                    'demerits_week_15' => '',
                    'percentage' => 30.00, // 100% of 30 points since all merits are 10
                    'total_merits' => 150, // 15 weeks * 10 points
                    'aptitude_30' => 30.00, // 150 * 0.30 = 45, but capped at 30
                    'updated_by' => 1, // System user
                    'merits_array' => json_encode(array_fill(0, $weekCount, '10')),
                    'demerits_array' => json_encode(array_fill(0, $weekCount, '')),
                ]);
                $createdCount++;
            } else {
                // Update existing record if merits_array or demerits_array is null
                $needsUpdate = false;
                $updates = [];

                if (is_null($existingMerit->merits_array)) {
                    $updates['merits_array'] = json_encode(array_fill(0, $weekCount, '10'));
                    $needsUpdate = true;
                }

                if (is_null($existingMerit->demerits_array)) {
                    $updates['demerits_array'] = json_encode(array_fill(0, $weekCount, ''));
                    $needsUpdate = true;
                }

                if ($needsUpdate) {
                    $existingMerit->update($updates);
                    $createdCount++;
                }
            }
        }

        $this->info("Second semester: {$createdCount} records created/updated");
        return $createdCount;
    }
}