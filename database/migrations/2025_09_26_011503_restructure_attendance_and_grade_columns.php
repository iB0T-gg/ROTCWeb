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
        // Remove columns from users table
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('users', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
            if (Schema::hasColumn('users', 'final_grade')) {
                $table->dropColumn('final_grade');
            }
            if (Schema::hasColumn('users', 'equivalent_grade')) {
                $table->dropColumn('equivalent_grade');
            }
        });

        // Add columns to first_semester_attendance table
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            if (!Schema::hasColumn('first_semester_attendance', 'weeks_present')) {
                $table->integer('weeks_present')->default(0)->after('semester');
            }
            if (!Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00)->after('weeks_present');
            }
        });

        // Add columns to second_semester_attendance table
        Schema::table('second_semester_attendance', function (Blueprint $table) {
            if (!Schema::hasColumn('second_semester_attendance', 'weeks_present')) {
                $table->integer('weeks_present')->default(0)->after('semester');
            }
            if (!Schema::hasColumn('second_semester_attendance', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00)->after('weeks_present');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove columns from attendance tables
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('first_semester_attendance', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
        });

        Schema::table('second_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('second_semester_attendance', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('second_semester_attendance', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
        });

        // Add columns back to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'weeks_present')) {
                $table->integer('weeks_present')->default(0)->after('profile_pic');
            }
            if (!Schema::hasColumn('users', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00)->after('weeks_present');
            }
            if (!Schema::hasColumn('users', 'final_grade')) {
                $table->decimal('final_grade', 5, 2)->nullable()->after('attendance_30');
            }
            if (!Schema::hasColumn('users', 'equivalent_grade')) {
                $table->decimal('equivalent_grade', 3, 2)->nullable()->after('final_grade');
            }
        });
    }
};