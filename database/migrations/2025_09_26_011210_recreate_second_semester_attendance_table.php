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
        // Drop the existing table
        Schema::dropIfExists('second_semester_attendance');
        
        // Recreate with correct structure
        Schema::create('second_semester_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('week_number');
            $table->boolean('is_present')->default(false);
            $table->date('attendance_date');
            $table->string('semester')->default('2025-2026 2nd semester');
            $table->timestamps();
            
            // Add unique constraint to prevent duplicate entries
            $table->unique(['user_id', 'week_number', 'attendance_date', 'semester'], 'ss_attendance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('second_semester_attendance');
    }
};