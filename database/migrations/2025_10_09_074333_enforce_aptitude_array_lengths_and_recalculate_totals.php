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
        // Enforce array lengths and recalculate totals/aptitude for both aptitude tables
        $configs = [
            'first_semester_aptitude' => 10,
            'second_semester_aptitude' => 15,
        ];

        foreach ($configs as $table => $targetWeeks) {
            DB::table($table)->orderBy('id')->chunkById(500, function ($rows) use ($table, $targetWeeks) {
                foreach ($rows as $row) {
                    // Parse arrays (may be JSON strings or native arrays depending on casting)
                    $meritsArray = self::toArray($row->merits_array ?? null);
                    $demeritsArray = self::toArray($row->demerits_array ?? null);

                    // Resize arrays to target length
                    $meritsArray = self::resizeArray($meritsArray, $targetWeeks, 10);
                    $demeritsArray = self::resizeArray($demeritsArray, $targetWeeks, 0);

                    // Recompute totals: total_merits = maxPossible - total_demerits
                    $maxPossible = $targetWeeks * 10;
                    $totalDemerits = array_reduce($demeritsArray, function ($s, $v) { return $s + (int) ($v ?: 0); }, 0);
                    $totalMerits = max(0, $maxPossible - $totalDemerits);

                    // aptitude_30 scales by maxPossible
                    $aptitude30 = min(30, max(0, round(($totalMerits / max(1, $maxPossible)) * 30)));

                    DB::table($table)
                        ->where('id', $row->id)
                        ->update([
                            'merits_array' => json_encode(array_values($meritsArray)),
                            'demerits_array' => json_encode(array_values($demeritsArray)),
                            'total_merits' => $totalMerits,
                            'aptitude_30' => $aptitude30,
                            'updated_at' => now(),
                        ]);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }

    private static function toArray($value): array
    {
        if (is_array($value)) return $value;
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }

    private static function resizeArray(array $arr, int $length, $padValue): array
    {
        $arr = array_values($arr);
        if (count($arr) < $length) return array_pad($arr, $length, $padValue);
        if (count($arr) > $length) return array_slice($arr, 0, $length);
        return $arr;
    }
};
