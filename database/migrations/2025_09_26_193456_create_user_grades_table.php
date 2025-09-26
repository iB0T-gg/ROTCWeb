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
        Schema::create('user_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('semester');
            $table->decimal('equivalent_grade', 3, 2);
            $table->string('remarks');
            $table->integer('final_grade');
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
        Schema::dropIfExists('user_grades');
    }
};