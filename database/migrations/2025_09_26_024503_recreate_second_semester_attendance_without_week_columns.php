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
        // First, backup existing data
        $existingData = DB::table('second_semester_attendance')->get();
        
        // Drop the existing table
        Schema::dropIfExists('second_semester_attendance');
        
        // Create new table without week_number and is_present columns
        Schema::create('second_semester_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('attendance_date');
            $table->string('semester')->default('2026-2027 2nd semester');
            $table->integer('weeks_present')->default(0);
            $table->integer('attendance_30')->default(0);
            $table->timestamps();
            
            // Create a unique constraint on user_id and semester (one record per user per semester)
            $table->unique(['user_id', 'semester'], 'ss_attendance_user_semester_unique');
        });
        
        // Restore data (without week_number and is_present)
        foreach ($existingData as $record) {
            DB::table('second_semester_attendance')->insert([
                'id' => $record->id,
                'user_id' => $record->user_id,
                'attendance_date' => $record->attendance_date,
                'semester' => $record->semester,
                'weeks_present' => $record->weeks_present,
                'attendance_30' => $record->attendance_30,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Backup existing data
        $existingData = DB::table('second_semester_attendance')->get();
        
        // Drop the current table
        Schema::dropIfExists('second_semester_attendance');
        
        // Recreate the original table structure
        Schema::create('second_semester_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('week_number');
            $table->boolean('is_present')->default(false);
            $table->date('attendance_date');
            $table->string('semester')->default('2026-2027 2nd semester');
            $table->integer('weeks_present')->default(0);
            $table->integer('attendance_30')->default(0);
            $table->timestamps();
            
            // Recreate the original unique constraint
            $table->unique(['user_id', 'week_number', 'attendance_date', 'semester'], 'ss_attendance_unique');
        });
        
        // Restore data with default values for week_number and is_present
        foreach ($existingData as $record) {
            DB::table('second_semester_attendance')->insert([
                'id' => $record->id,
                'user_id' => $record->user_id,
                'week_number' => 1, // Default value
                'is_present' => false, // Default value
                'attendance_date' => $record->attendance_date,
                'semester' => $record->semester,
                'weeks_present' => $record->weeks_present,
                'attendance_30' => $record->attendance_30,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
            ]);
        }
    }
};