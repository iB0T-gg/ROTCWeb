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
        // We need a completely different approach for MySQL vs SQLite
        if (config('database.default') === 'mysql') {
            // Instead of creating a new table and dealing with copying data,
            // we'll modify the existing table structure if needed
            if (Schema::hasTable('first_semester_merits')) {
                // Check if needed fields exist, add them if not
                Schema::table('first_semester_merits', function (Blueprint $table) {
                    // Ensure semester column exists
                    if (!Schema::hasColumn('first_semester_merits', 'semester')) {
                        $table->string('semester')->default('2025-2026 1st semester')->after('type');
                    }
                    
                    // Ensure days_array column exists
                    if (!Schema::hasColumn('first_semester_merits', 'days_array')) {
                        $table->json('days_array')->nullable()->after('percentage');
                    }
                });
                
                // Check if the existing uniqueness constraint is the old format
                // If so, drop and recreate it
                try {
                    DB::statement('ALTER TABLE first_semester_merits DROP INDEX first_semester_merits_cadet_id_type_unique');
                    Schema::table('first_semester_merits', function (Blueprint $table) {
                        $table->unique(['cadet_id', 'type', 'semester']);
                    });
                } catch (\Exception $e) {
                    // Constraint might already be correct format or doesn't exist
                    // Check if it exists in the new format before creating
                    $indexExists = DB::select("SHOW INDEX FROM first_semester_merits WHERE Key_name = 'first_semester_merits_cadet_id_type_semester_unique'");
                    if (empty($indexExists)) {
                        Schema::table('first_semester_merits', function (Blueprint $table) {
                            $table->unique(['cadet_id', 'type', 'semester']);
                        });
                    }
                }
            } else {
                // If table doesn't exist, create it with correct structure
                Schema::create('first_semester_merits', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('cadet_id');
                    $table->foreign('cadet_id')->references('id')->on('users')->onDelete('cascade');
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
                    $table->unsignedBigInteger('updated_by')->nullable();
                    $table->foreign('updated_by')->references('id')->on('users');
                    $table->json('days_array')->nullable();
                    $table->timestamps();
                    
                    $table->unique(['cadet_id', 'type', 'semester']);
                });
            }
        } else {
            // For SQLite
            // Drop the new table if it exists from previous failed attempts
            Schema::dropIfExists('first_semester_merits_new');
            
            // Create a new table with the correct structure matching second_semester_merits
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
            
            // Copy data and rename tables for SQLite
            if (Schema::hasTable('first_semester_merits')) {
                DB::statement('INSERT INTO first_semester_merits_new (id, cadet_id, type, semester, day_1, day_2, day_3, day_4, day_5, day_6, day_7, day_8, day_9, day_10, day_11, day_12, day_13, day_14, day_15, percentage, updated_by, days_array, created_at, updated_at) SELECT id, cadet_id, type, semester, day_1, day_2, day_3, day_4, day_5, day_6, day_7, day_8, day_9, day_10, day_11, day_12, day_13, day_14, day_15, percentage, updated_by, days_array, created_at, updated_at FROM first_semester_merits');
                Schema::dropIfExists('first_semester_merits');
                Schema::rename('first_semester_merits_new', 'first_semester_merits');
            }
        }
        
        // We've moved all the logic into the conditional blocks above
        // This makes the migration cleaner and handles both database types properly
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not easily reversible due to data structure changes
        // If needed, restore from backup
    }
};
