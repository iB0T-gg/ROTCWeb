<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Merit; // first semester
use App\Models\SecondSemesterMerit; // second semester

class PopulateAptitude extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aptitude:populate {--semester=both : first|second|both} {--defaults=full : full|empty}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create aptitude rows for all cadets in first and/or second semester with default values';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $semesterOption = strtolower((string)$this->option('semester')) ?: 'both';
        $useFullDefaults = strtolower((string)$this->option('defaults')) !== 'empty';

        $cadets = User::where('role', 'user')->get(['id']);
        $this->info('Cadets found: '.$cadets->count());

        if ($semesterOption === 'first' || $semesterOption === 'both') {
            $this->populateFirst($cadets, $useFullDefaults);
        }

        if ($semesterOption === 'second' || $semesterOption === 'both') {
            $this->populateSecond($cadets, $useFullDefaults);
        }

        $this->info('Done.');
        return Command::SUCCESS;
    }

    private function populateFirst($cadets, bool $full): void
    {
        $this->info('Populating first_semester_aptitude...');
        $meritValues = array_fill(0, 10, $full ? 10 : null);
        $demeritValues = array_fill(0, 10, $full ? 0 : null);
        $percentage = $full ? 30 : 0;

        foreach ($cadets as $cadet) {
            $model = Merit::firstOrNew([
                'cadet_id' => $cadet->id,
                'type' => 'military_attitude',
                'semester' => '2025-2026 1st semester',
            ]);

            // Week columns
            for ($i = 1; $i <= 10; $i++) {
                $model->{"merits_week_$i"} = $meritValues[$i-1];
                $model->{"demerits_week_$i"} = $demeritValues[$i-1];
            }

            $model->days_array = $meritValues;
            $model->demerits_array = $demeritValues;
            $model->percentage = $percentage;
            $model->save();
        }
    }

    private function populateSecond($cadets, bool $full): void
    {
        $this->info('Populating second_semester_aptitude...');
        $meritValues = array_fill(0, 15, $full ? 10 : null);
        $demeritValues = array_fill(0, 15, $full ? 0 : null);
        $percentage = $full ? 30 : 0;

        foreach ($cadets as $cadet) {
            $model = SecondSemesterMerit::firstOrNew([
                'cadet_id' => $cadet->id,
                'type' => 'military_attitude',
                'semester' => '2025-2026 2nd semester',
            ]);

            // Week columns
            for ($i = 1; $i <= 15; $i++) {
                $model->{"merits_week_$i"} = $meritValues[$i-1];
                $model->{"demerits_week_$i"} = $demeritValues[$i-1];
            }

            $model->days_array = $meritValues;
            $model->demerits_array = $demeritValues;
            $model->percentage = $percentage;
            $model->save();
        }
    }
}


