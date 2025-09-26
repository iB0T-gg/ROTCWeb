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
        // Drop the existing first_semester_attendance table
        Schema::dropIfExists('first_semester_attendance');
        
        // Recreate with aggregated structure (one record per user)
        Schema::create('first_semester_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('weeks_present')->default(0);
            $table->decimal('attendance_30', 8, 2)->default(0.00);
            $table->string('semester')->default('2025-2026 1st semester');
            $table->date('attendance_date')->nullable(); // Last attendance date
            $table->timestamps();
            
            // Add unique constraint to ensure one record per user per semester
            $table->unique(['user_id', 'semester'], 'fs_attendance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the aggregated table
        Schema::dropIfExists('first_semester_attendance');
        
        // Recreate the original structure
        Schema::create('first_semester_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('week_number');
            $table->boolean('is_present')->default(false);
            $table->date('attendance_date');
            $table->string('semester')->default('2025-2026 1st semester');
            $table->integer('weeks_present')->default(0);
            $table->decimal('attendance_30', 8, 2)->default(0.00);
            $table->timestamps();
            
            // Add unique constraint to prevent duplicate entries
            $table->unique(['user_id', 'week_number', 'attendance_date', 'semester'], 'fs_attendance_unique');
        });
    }
};