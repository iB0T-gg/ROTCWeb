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
        // Rename the attendances table to first_semester_attendance
        Schema::rename('attendances', 'first_semester_attendance');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename back to attendances
        Schema::rename('first_semester_attendance', 'attendances');
    }
};