<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reorder columns in first_semester_aptitude table
        $this->reorderTableColumns('first_semester_aptitude');
        
        // Reorder columns in second_semester_aptitude table
        $this->reorderTableColumns('second_semester_aptitude');
    }

    private function reorderTableColumns($tableName)
    {
        // Get all data from the original table
        $data = \DB::table($tableName)->get();
        
        // Create new table with correct column order
        Schema::dropIfExists($tableName . '_temp');
        Schema::create($tableName . '_temp', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cadet_id');
            $table->string('type');
            $table->string('semester');
            
            // Add merits and demerits columns in alternating order
            for ($i = 1; $i <= 15; $i++) {
                $table->string("merits_week_$i")->nullable();
                $table->string("demerits_week_$i")->nullable();
            }
            
            $table->decimal('percentage', 5, 2)->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->text('days_array')->nullable();
            $table->timestamps();
        });
        
        // Copy data to new table
        foreach ($data as $row) {
            \DB::table($tableName . '_temp')->insert([
                'id' => $row->id,
                'cadet_id' => $row->cadet_id,
                'type' => $row->type,
                'semester' => $row->semester,
                'merits_week_1' => $row->merits_week_1,
                'demerits_week_1' => $row->demerits_week_1,
                'merits_week_2' => $row->merits_week_2,
                'demerits_week_2' => $row->demerits_week_2,
                'merits_week_3' => $row->merits_week_3,
                'demerits_week_3' => $row->demerits_week_3,
                'merits_week_4' => $row->merits_week_4,
                'demerits_week_4' => $row->demerits_week_4,
                'merits_week_5' => $row->merits_week_5,
                'demerits_week_5' => $row->demerits_week_5,
                'merits_week_6' => $row->merits_week_6,
                'demerits_week_6' => $row->demerits_week_6,
                'merits_week_7' => $row->merits_week_7,
                'demerits_week_7' => $row->demerits_week_7,
                'merits_week_8' => $row->merits_week_8,
                'demerits_week_8' => $row->demerits_week_8,
                'merits_week_9' => $row->merits_week_9,
                'demerits_week_9' => $row->demerits_week_9,
                'merits_week_10' => $row->merits_week_10,
                'demerits_week_10' => $row->demerits_week_10,
                'merits_week_11' => $row->merits_week_11,
                'demerits_week_11' => $row->demerits_week_11,
                'merits_week_12' => $row->merits_week_12,
                'demerits_week_12' => $row->demerits_week_12,
                'merits_week_13' => $row->merits_week_13,
                'demerits_week_13' => $row->demerits_week_13,
                'merits_week_14' => $row->merits_week_14,
                'demerits_week_14' => $row->demerits_week_14,
                'merits_week_15' => $row->merits_week_15,
                'demerits_week_15' => $row->demerits_week_15,
                'percentage' => $row->percentage,
                'updated_by' => $row->updated_by,
                'days_array' => $row->days_array,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }
        
        // Drop original table and rename temp table
        Schema::dropIfExists($tableName);
        Schema::rename($tableName . '_temp', $tableName);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration reorders columns, so rolling back would require
        // recreating the tables with the original column order.
        // For safety, we'll leave the tables as they are.
        // If rollback is needed, it should be done manually.
    }
};
