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
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            // Drop incorrect columns that shouldn't be in individual attendance records
            if (Schema::hasColumn('first_semester_attendance', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
            
            // Ensure the correct columns exist
            if (!Schema::hasColumn('first_semester_attendance', 'week_number')) {
                $table->integer('week_number')->after('user_id');
            }
            if (!Schema::hasColumn('first_semester_attendance', 'is_present')) {
                $table->boolean('is_present')->default(false)->after('week_number');
            }
            if (!Schema::hasColumn('first_semester_attendance', 'attendance_date')) {
                $table->date('attendance_date')->after('is_present');
            }
            if (!Schema::hasColumn('first_semester_attendance', 'semester')) {
                $table->string('semester')->default('2025-2026 1st semester')->after('attendance_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            // Add back the incorrect columns (for rollback purposes)
            if (!Schema::hasColumn('first_semester_attendance', 'weeks_present')) {
                $table->integer('weeks_present')->default(0);
            }
            if (!Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00);
            }
        });
    }
};