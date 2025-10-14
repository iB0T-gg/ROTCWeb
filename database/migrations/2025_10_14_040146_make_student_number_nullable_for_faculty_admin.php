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
        Schema::table('users', function (Blueprint $table) {
            // First, drop the unique constraint
            $table->dropUnique(['student_number']);
            
            // Make the column nullable
            $table->string('student_number')->nullable()->change();
            
            // Add a new unique constraint that allows multiple nulls
            $table->unique(['student_number'], 'users_student_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the nullable unique constraint
            $table->dropUnique('users_student_number_unique');
            
            // Make the column not nullable again
            $table->string('student_number')->nullable(false)->change();
            
            // Restore the original unique constraint
            $table->unique('student_number');
        });
    }
};
