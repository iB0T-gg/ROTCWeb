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
        // Add weekly attendance columns to first_semester_attendance
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            for ($i = 1; $i <= 15; $i++) {
                $table->boolean("week_{$i}")->default(false)->after('attendance_30');
            }
        });

        // Add weekly attendance columns to second_semester_attendance
        Schema::table('second_semester_attendance', function (Blueprint $table) {
            for ($i = 1; $i <= 15; $i++) {
                $table->boolean("week_{$i}")->default(false)->after('attendance_30');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove weekly attendance columns from first_semester_attendance
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            for ($i = 1; $i <= 15; $i++) {
                $table->dropColumn("week_{$i}");
            }
        });

        // Remove weekly attendance columns from second_semester_attendance
        Schema::table('second_semester_attendance', function (Blueprint $table) {
            for ($i = 1; $i <= 15; $i++) {
                $table->dropColumn("week_{$i}");
            }
        });
    }
};
