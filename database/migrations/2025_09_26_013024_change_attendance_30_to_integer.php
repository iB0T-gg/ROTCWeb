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
        // Update first_semester_attendance table
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->integer('attendance_30')->default(0)->change();
            }
        });

        // Update second_semester_attendance table
        Schema::table('second_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('second_semester_attendance', 'attendance_30')) {
                $table->integer('attendance_30')->default(0)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert first_semester_attendance table
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('first_semester_attendance', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00)->change();
            }
        });

        // Revert second_semester_attendance table
        Schema::table('second_semester_attendance', function (Blueprint $table) {
            if (Schema::hasColumn('second_semester_attendance', 'attendance_30')) {
                $table->decimal('attendance_30', 8, 2)->default(0.00)->change();
            }
        });
    }
};