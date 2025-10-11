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
        Schema::create('second_semester_exam_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('midterm_exam')->nullable();
            $table->integer('final_exam')->nullable();
            $table->string('semester')->default('2025-2026 2nd semester');
            $table->timestamps();
            
            // Add unique constraint to prevent duplicate entries per user per semester
            $table->unique(['user_id', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('second_semester_exam_scores');
    }
};