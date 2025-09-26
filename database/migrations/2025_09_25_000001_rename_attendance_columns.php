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
        // First semester table
        if (Schema::hasTable('first_semester_attendance')) {
            Schema::table('first_semester_attendance', function (Blueprint $table) {
                if (Schema::hasColumn('first_semester_attendance', 'day_number')) {
                    $table->renameColumn('day_number', 'week_number');
                }
                // Keep is_present as is for individual week records
            });
        }

        // Second semester table
        if (Schema::hasTable('second_semester_attendance')) {
            Schema::table('second_semester_attendance', function (Blueprint $table) {
                if (Schema::hasColumn('second_semester_attendance', 'day_number')) {
                    $table->renameColumn('day_number', 'week_number');
                }
                // Keep is_present as is for individual week records
            });
        }

        // Add aggregated attendance columns to users table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'weeks_present')) {
                    $table->integer('weeks_present')->default(0)->after('final_grade');
                }
                if (!Schema::hasColumn('users', 'attendance_30')) {
                    $table->decimal('attendance_30', 5, 2)->default(0)->after('weeks_present');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First semester table
        if (Schema::hasTable('first_semester_attendance')) {
            Schema::table('first_semester_attendance', function (Blueprint $table) {
                if (Schema::hasColumn('first_semester_attendance', 'week_number')) {
                    $table->renameColumn('week_number', 'day_number');
                }
            });
        }

        // Second semester table
        if (Schema::hasTable('second_semester_attendance')) {
            Schema::table('second_semester_attendance', function (Blueprint $table) {
                if (Schema::hasColumn('second_semester_attendance', 'week_number')) {
                    $table->renameColumn('week_number', 'day_number');
                }
            });
        }

        // Remove aggregated attendance columns from users table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'weeks_present')) {
                    $table->dropColumn('weeks_present');
                }
                if (Schema::hasColumn('users', 'attendance_30')) {
                    $table->dropColumn('attendance_30');
                }
            });
        }
    }
};


