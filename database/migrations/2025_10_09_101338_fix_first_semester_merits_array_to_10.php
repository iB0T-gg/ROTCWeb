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
        // Normalize existing rows in first_semester_aptitude to 10 weeks
        DB::table('first_semester_aptitude')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                foreach ($rows as $row) {
                    $merits = $this->toArray($row->merits_array ?? null);
                    $demerits = $this->toArray($row->demerits_array ?? null);

                    $merits10 = array_slice($merits, 0, 10);
                    if (count($merits10) < 10) {
                        $merits10 = array_merge($merits10, array_fill(0, 10 - count($merits10), 10));
                    }

                    $demerits10 = array_slice($demerits, 0, 10);
                    if (count($demerits10) < 10) {
                        $demerits10 = array_merge($demerits10, array_fill(0, 10 - count($demerits10), ''));
                    }

                    // Compute totals (max 100)
                    $meritValues = array_map(function ($v) { return (int)($v === '' || $v === null ? 0 : $v); }, $merits10);
                    $sum = array_sum($meritValues);
                    $aptitude30 = min(30, max(0, round(($sum / 100) * 30)));

                    DB::table('first_semester_aptitude')
                        ->where('id', $row->id)
                        ->update([
                            'merits_array' => json_encode(array_values($merits10)),
                            'demerits_array' => json_encode(array_values($demerits10)),
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
