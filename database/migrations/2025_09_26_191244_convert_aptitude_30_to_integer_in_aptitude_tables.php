<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            // First, round all existing decimal values to integers
            DB::statement('UPDATE first_semester_aptitude SET aptitude_30 = ROUND(aptitude_30) WHERE aptitude_30 IS NOT NULL');
            
            // Change the column type from decimal to integer
            $table->integer('aptitude_30')->default(0)->change();
        });

        // Convert second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            // First, round all existing decimal values to integers
            DB::statement('UPDATE second_semester_aptitude SET aptitude_30 = ROUND(aptitude_30) WHERE aptitude_30 IS NOT NULL');
            
            // Change the column type from decimal to integer
            $table->integer('aptitude_30')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            // Change back to decimal
            $table->decimal('aptitude_30', 5, 2)->default(0.00)->change();
        });

        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            // Change back to decimal
            $table->decimal('aptitude_30', 5, 2)->default(0.00)->change();
        });
    }
};