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
        // Normalize merits_array sizes across aptitude tables
        $tables = [
            'first_semester_aptitude' => 10,
            'second_semester_aptitude' => 15,
        ];

        foreach ($tables as $table => $targetLength) {
            DB::table($table)
                ->orderBy('id')
                ->chunkById(500, function ($rows) use ($table, $targetLength) {
                    foreach ($rows as $row) {
                        $meritsArrayRaw = $row->merits_array ?? null;

                        // Decode JSON if needed; handle arrays already casted as JSON strings
                        if (is_string($meritsArrayRaw)) {
                            $decoded = json_decode($meritsArrayRaw, true);
                            $meritsArray = is_array($decoded) ? $decoded : [];
                        } elseif (is_array($meritsArrayRaw)) {
                            $meritsArray = $meritsArrayRaw;
                        } else {
                            $meritsArray = [];
                        }

                        // Normalize array: pad with 10s or truncate to the target length
                        if (count($meritsArray) < $targetLength) {
                            $meritsArray = array_pad($meritsArray, $targetLength, 10);
                        } elseif (count($meritsArray) > $targetLength) {
                            $meritsArray = array_slice($meritsArray, 0, $targetLength);
                        }

                        // Write back normalized JSON
                        DB::table($table)
                            ->where('id', $row->id)
                            ->update([
                                'merits_array' => json_encode(array_values($meritsArray)),
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
        // No-op: array length normalization is not trivially reversible
    }
};
