<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First semester: 10 weeks
        DB::table('first_semester_aptitude')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                $dem = $this->toArray($row->demerits_array ?? null);
                $dem10 = array_slice($dem, 0, 10);
                if (count($dem10) < 10) {
                    $dem10 = array_merge($dem10, array_fill(0, 10 - count($dem10), ''));
                }

                // Recompute totals (based on merits_array if present or columns)
                $merits = $this->toArray($row->merits_array ?? null);
                if (empty($merits)) {
                    // Fallback: read week columns merits_week_1..10 if arrays are empty
                    $merits = [];
                    for ($i = 1; $i <= 10; $i++) {
                        $merits[] = (int)($row->{"merits_week_$i"} ?? 0);
                    }
                }
                $merits10 = array_slice($merits, 0, 10);
                if (count($merits10) < 10) {
                    $merits10 = array_merge($merits10, array_fill(0, 10 - count($merits10), 10));
                }
                $sum = array_sum(array_map(fn($v)=> (int)($v === '' || $v === null ? 0 : $v), $merits10));
                $aptitude30 = min(30, max(0, round(($sum / 100) * 30)));

                DB::table('first_semester_aptitude')
                    ->where('id', $row->id)
                    ->update([
                        'demerits_array' => json_encode(array_values($dem10)),
                        'total_merits' => $sum,
                        'aptitude_30' => $aptitude30,
                        'updated_at' => now(),
                    ]);
            }
        });

        // Second semester: 15 weeks
        DB::table('second_semester_aptitude')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                $dem = $this->toArray($row->demerits_array ?? null);
                $dem15 = array_slice($dem, 0, 15);
                if (count($dem15) < 15) {
                    $dem15 = array_merge($dem15, array_fill(0, 15 - count($dem15), ''));
                }

                // Recompute totals for second semester from merits_array or columns (max 150)
                $merits = $this->toArray($row->merits_array ?? null);
                if (empty($merits)) {
                    $merits = [];
                    for ($i = 1; $i <= 15; $i++) {
                        $merits[] = (int)($row->{"merits_week_$i"} ?? 0);
                    }
                }
                $merits15 = array_slice($merits, 0, 15);
                if (count($merits15) < 15) {
                    $merits15 = array_merge($merits15, array_fill(0, 15 - count($merits15), 10));
                }
                $sum = array_sum(array_map(fn($v)=> (int)($v === '' || $v === null ? 0 : $v), $merits15));
                $aptitude30 = min(30, max(0, round(($sum / 150) * 30)));

                DB::table('second_semester_aptitude')
                    ->where('id', $row->id)
                    ->update([
                        'demerits_array' => json_encode(array_values($dem15)),
                        'total_merits' => $sum,
                        'aptitude_30' => $aptitude30,
                        'updated_at' => now(),
                    ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }

    private function toArray($value): array
    {
        if (is_array($value)) return $value;
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }
};
