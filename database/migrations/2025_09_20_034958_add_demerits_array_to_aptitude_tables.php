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
        // Add demerits_array column to first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->text('demerits_array')->nullable()->after('days_array');
        });

        // Add demerits_array column to second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->text('demerits_array')->nullable()->after('days_array');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove demerits_array column from first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn('demerits_array');
        });

        // Remove demerits_array column from second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn('demerits_array');
        });
    }
};
