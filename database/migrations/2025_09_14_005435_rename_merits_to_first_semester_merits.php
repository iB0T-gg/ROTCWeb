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
        // First, rename the merits table to first_semester_merits
        Schema::rename('merits', 'first_semester_merits');
        
        // Create a new table with the correct structure
        Schema::create('first_semester_merits_new', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cadet_id')->constrained('users')->onDelete('cascade');
            $table->string('type')->default('military_attitude');
            $table->string('semester')->default('2025-2026 1st semester');
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
        
        // Copy data from old table to new table (handle column order differences)
        DB::statement('INSERT INTO first_semester_merits_new (id, cadet_id, type, semester, day_1, day_2, day_3, day_4, day_5, day_6, day_7, day_8, day_9, day_10, day_11, day_12, day_13, day_14, day_15, percentage, updated_by, days_array, created_at, updated_at) SELECT id, cadet_id, type, semester, day_1, day_2, day_3, day_4, day_5, day_6, day_7, day_8, day_9, day_10, day_11, day_12, day_13, day_14, day_15, percentage, updated_by, days_array, created_at, updated_at FROM first_semester_merits');
        
        // Drop the old table and rename the new one
        Schema::dropIfExists('first_semester_merits');
        Schema::rename('first_semester_merits_new', 'first_semester_merits');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename back to merits
        Schema::rename('first_semester_merits', 'merits');
    }
};
