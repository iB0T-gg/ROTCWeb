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
        // Rename days_array to merits_array in first_semester_aptitude table
        if (Schema::hasColumn('first_semester_aptitude', 'days_array')) {
            Schema::table('first_semester_aptitude', function (Blueprint $table) {
                $table->renameColumn('days_array', 'merits_array');
            });
        }

        // Rename days_array to merits_array in second_semester_aptitude table
        if (Schema::hasColumn('second_semester_aptitude', 'days_array')) {
            Schema::table('second_semester_aptitude', function (Blueprint $table) {
                $table->renameColumn('days_array', 'merits_array');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename merits_array back to days_array in first_semester_aptitude table
        if (Schema::hasColumn('first_semester_aptitude', 'merits_array')) {
            Schema::table('first_semester_aptitude', function (Blueprint $table) {
                $table->renameColumn('merits_array', 'days_array');
            });
        }

        // Rename merits_array back to days_array in second_semester_aptitude table
        if (Schema::hasColumn('second_semester_aptitude', 'merits_array')) {
            Schema::table('second_semester_aptitude', function (Blueprint $table) {
                $table->renameColumn('merits_array', 'days_array');
            });
        }
    }
};
