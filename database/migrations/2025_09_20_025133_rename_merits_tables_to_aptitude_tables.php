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
        // Rename first_semester_merits to first_semester_aptitude
        Schema::rename('first_semester_merits', 'first_semester_aptitude');
        
        // Rename second_semester_merits to second_semester_aptitude
        Schema::rename('second_semester_merits', 'second_semester_aptitude');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the table renames
        Schema::rename('first_semester_aptitude', 'first_semester_merits');
        Schema::rename('second_semester_aptitude', 'second_semester_merits');
    }
};
