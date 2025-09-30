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
        // Drop percentage column from first_semester_aptitude if it exists
        if (Schema::hasColumn('first_semester_aptitude', 'percentage')) {
            Schema::table('first_semester_aptitude', function (Blueprint $table) {
                $table->dropColumn('percentage');
            });
        }

        // Reorder columns in second_semester_aptitude to match first semester structure
        // We need to recreate the table to reorder columns properly
        Schema::rename('second_semester_aptitude', 'second_semester_aptitude_old');

        Schema::create('second_semester_aptitude', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cadet_id');
            $table->string('type')->default('military_attitude');
            $table->string('semester');
            
            // Week columns (15 weeks for second semester)
            $table->string('merits_week_1')->nullable();
            $table->string('demerits_week_1')->nullable();
            $table->string('merits_week_2')->nullable();
            $table->string('demerits_week_2')->nullable();
            $table->string('merits_week_3')->nullable();
            $table->string('demerits_week_3')->nullable();
            $table->string('merits_week_4')->nullable();
            $table->string('demerits_week_4')->nullable();
            $table->string('merits_week_5')->nullable();
            $table->string('demerits_week_5')->nullable();
            $table->string('merits_week_6')->nullable();
            $table->string('demerits_week_6')->nullable();
            $table->string('merits_week_7')->nullable();
            $table->string('demerits_week_7')->nullable();
            $table->string('merits_week_8')->nullable();
            $table->string('demerits_week_8')->nullable();
            $table->string('merits_week_9')->nullable();
            $table->string('demerits_week_9')->nullable();
            $table->string('merits_week_10')->nullable();
            $table->string('demerits_week_10')->nullable();
            $table->string('merits_week_11')->nullable();
            $table->string('demerits_week_11')->nullable();
            $table->string('merits_week_12')->nullable();
            $table->string('demerits_week_12')->nullable();
            $table->string('merits_week_13')->nullable();
            $table->string('demerits_week_13')->nullable();
            $table->string('merits_week_14')->nullable();
            $table->string('demerits_week_14')->nullable();
            $table->string('merits_week_15')->nullable();
            $table->string('demerits_week_15')->nullable();
            
            // Calculated fields (matching first semester order)
            $table->integer('total_merits')->default(0);
            $table->decimal('aptitude_30', 5, 2)->default(0.00);
            $table->unsignedBigInteger('updated_by')->nullable();
            
            // JSON arrays
            $table->json('merits_array')->nullable();
            $table->json('demerits_array')->nullable();
            
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('cadet_id')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users');
        });

        // Copy data from old table to new table
        $oldRecords = DB::table('second_semester_aptitude_old')->get();
        foreach ($oldRecords as $record) {
            DB::table('second_semester_aptitude')->insert([
                'id' => $record->id,
                'cadet_id' => $record->cadet_id,
                'type' => $record->type,
                'semester' => $record->semester,
                'merits_week_1' => $record->merits_week_1,
                'demerits_week_1' => $record->demerits_week_1,
                'merits_week_2' => $record->merits_week_2,
                'demerits_week_2' => $record->demerits_week_2,
                'merits_week_3' => $record->merits_week_3,
                'demerits_week_3' => $record->demerits_week_3,
                'merits_week_4' => $record->merits_week_4,
                'demerits_week_4' => $record->demerits_week_4,
                'merits_week_5' => $record->merits_week_5,
                'demerits_week_5' => $record->demerits_week_5,
                'merits_week_6' => $record->merits_week_6,
                'demerits_week_6' => $record->demerits_week_6,
                'merits_week_7' => $record->merits_week_7,
                'demerits_week_7' => $record->demerits_week_7,
                'merits_week_8' => $record->merits_week_8,
                'demerits_week_8' => $record->demerits_week_8,
                'merits_week_9' => $record->merits_week_9,
                'demerits_week_9' => $record->demerits_week_9,
                'merits_week_10' => $record->merits_week_10,
                'demerits_week_10' => $record->demerits_week_10,
                'merits_week_11' => $record->merits_week_11,
                'demerits_week_11' => $record->demerits_week_11,
                'merits_week_12' => $record->merits_week_12,
                'demerits_week_12' => $record->demerits_week_12,
                'merits_week_13' => $record->merits_week_13,
                'demerits_week_13' => $record->demerits_week_13,
                'merits_week_14' => $record->merits_week_14,
                'demerits_week_14' => $record->demerits_week_14,
                'merits_week_15' => $record->merits_week_15,
                'demerits_week_15' => $record->demerits_week_15,
                'total_merits' => $record->total_merits,
                'aptitude_30' => $record->aptitude_30,
                'updated_by' => $record->updated_by,
                'merits_array' => $record->merits_array,
                'demerits_array' => $record->demerits_array,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
            ]);
        }

        // Drop the old table
        Schema::dropIfExists('second_semester_aptitude_old');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add percentage column back to first_semester_aptitude if it doesn't already exist
        if (!Schema::hasColumn('first_semester_aptitude', 'percentage')) {
            Schema::table('first_semester_aptitude', function (Blueprint $table) {
                $table->decimal('percentage', 5, 2)->default(0)->after('merits_week_10');
            });
        }

        // Revert second_semester_aptitude to original structure
        Schema::rename('second_semester_aptitude', 'second_semester_aptitude_new');
        
        Schema::create('second_semester_aptitude', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cadet_id');
            $table->string('type')->default('military_attitude');
            $table->string('semester');
            
            // Week columns
            $table->string('merits_week_1')->nullable();
            $table->string('demerits_week_1')->nullable();
            $table->string('merits_week_2')->nullable();
            $table->string('demerits_week_2')->nullable();
            $table->string('merits_week_3')->nullable();
            $table->string('demerits_week_3')->nullable();
            $table->string('merits_week_4')->nullable();
            $table->string('demerits_week_4')->nullable();
            $table->string('merits_week_5')->nullable();
            $table->string('demerits_week_5')->nullable();
            $table->string('merits_week_6')->nullable();
            $table->string('demerits_week_6')->nullable();
            $table->string('merits_week_7')->nullable();
            $table->string('demerits_week_7')->nullable();
            $table->string('merits_week_8')->nullable();
            $table->string('demerits_week_8')->nullable();
            $table->string('merits_week_9')->nullable();
            $table->string('demerits_week_9')->nullable();
            $table->string('merits_week_10')->nullable();
            $table->string('demerits_week_10')->nullable();
            $table->string('merits_week_11')->nullable();
            $table->string('demerits_week_11')->nullable();
            $table->string('merits_week_12')->nullable();
            $table->string('demerits_week_12')->nullable();
            $table->string('merits_week_13')->nullable();
            $table->string('demerits_week_13')->nullable();
            $table->string('merits_week_14')->nullable();
            $table->string('demerits_week_14')->nullable();
            $table->string('merits_week_15')->nullable();
            $table->string('demerits_week_15')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->json('merits_array')->nullable();
            $table->json('demerits_array')->nullable();
            $table->timestamps();
            $table->integer('total_merits')->default(0);
            $table->decimal('aptitude_30', 5, 2)->default(0.00);
            
            $table->foreign('cadet_id')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users');
        });

        // Copy data back
        $newRecords = DB::table('second_semester_aptitude_new')->get();
        foreach ($newRecords as $record) {
            DB::table('second_semester_aptitude')->insert([
                'id' => $record->id,
                'cadet_id' => $record->cadet_id,
                'type' => $record->type,
                'semester' => $record->semester,
                'merits_week_1' => $record->merits_week_1,
                'demerits_week_1' => $record->demerits_week_1,
                'merits_week_2' => $record->merits_week_2,
                'demerits_week_2' => $record->demerits_week_2,
                'merits_week_3' => $record->merits_week_3,
                'demerits_week_3' => $record->demerits_week_3,
                'merits_week_4' => $record->merits_week_4,
                'demerits_week_4' => $record->demerits_week_4,
                'merits_week_5' => $record->merits_week_5,
                'demerits_week_5' => $record->demerits_week_5,
                'merits_week_6' => $record->merits_week_6,
                'demerits_week_6' => $record->demerits_week_6,
                'merits_week_7' => $record->merits_week_7,
                'demerits_week_7' => $record->demerits_week_7,
                'merits_week_8' => $record->merits_week_8,
                'demerits_week_8' => $record->demerits_week_8,
                'merits_week_9' => $record->merits_week_9,
                'demerits_week_9' => $record->demerits_week_9,
                'merits_week_10' => $record->merits_week_10,
                'demerits_week_10' => $record->demerits_week_10,
                'merits_week_11' => $record->merits_week_11,
                'demerits_week_11' => $record->demerits_week_11,
                'merits_week_12' => $record->merits_week_12,
                'demerits_week_12' => $record->demerits_week_12,
                'merits_week_13' => $record->merits_week_13,
                'demerits_week_13' => $record->demerits_week_13,
                'merits_week_14' => $record->merits_week_14,
                'demerits_week_14' => $record->demerits_week_14,
                'merits_week_15' => $record->merits_week_15,
                'demerits_week_15' => $record->demerits_week_15,
                'updated_by' => $record->updated_by,
                'merits_array' => $record->merits_array,
                'demerits_array' => $record->demerits_array,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
                'total_merits' => $record->total_merits,
                'aptitude_30' => $record->aptitude_30,
            ]);
        }

        Schema::dropIfExists('second_semester_aptitude_new');
    }
};