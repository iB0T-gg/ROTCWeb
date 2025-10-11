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
        Schema::create('second_semester_merits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cadet_id')->constrained('users')->onDelete('cascade');
            $table->string('type')->default('military_attitude');
            $table->string('semester')->default('2025-2026 2nd semester');
            $table->string('day_1')->nullable();
            $table->string('day_2')->nullable();
            $table->string('day_3')->nullable();
            $table->string('day_4')->nullable();
            $table->string('day_5')->nullable();
            $table->string('day_6')->nullable();
            $table->string('day_7')->nullable();
            $table->string('day_8')->nullable();
            $table->string('day_9')->nullable();
            $table->string('day_10')->nullable();
            $table->string('day_11')->nullable();
            $table->string('day_12')->nullable();
            $table->string('day_13')->nullable();
            $table->string('day_14')->nullable();
            $table->string('day_15')->nullable();
            $table->decimal('percentage', 5, 2)->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->json('days_array')->nullable();
            $table->timestamps();
            
            // Ensure one merit record per cadet per type per semester
            $table->unique(['cadet_id', 'type', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('second_semester_merits');
    }
};
