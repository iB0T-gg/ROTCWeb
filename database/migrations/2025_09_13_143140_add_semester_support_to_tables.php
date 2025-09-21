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
        // For MySQL, we need a different approach due to foreign key constraints
        if (config('database.default') === 'mysql') {
            // Create a new table with the updated schema
            Schema::create('merits_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cadet_id')->constrained('users')->onDelete('cascade');
                $table->string('type');
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
                
                // Add the new unique constraint with semester included
                $table->unique(['cadet_id', 'type', 'semester']);
            });
            
            // Copy data from old table to new table, adding default semester value
            if (Schema::hasTable('merits')) {
                $merits = DB::table('merits')->get();
                foreach ($merits as $merit) {
                    $data = (array) $merit;
                    // Add the semester field if it doesn't exist
                    if (!array_key_exists('semester', $data)) {
                        $data['semester'] = '2025-2026 1st semester';
                    }
                    DB::table('merits_new')->insert($data);
                }
                
                // Drop the old table and rename the new one
                Schema::dropIfExists('merits');
                Schema::rename('merits_new', 'merits');
            }
        } else {
            // For SQLite, we can follow the original approach
            // Add semester column to merits table
            if (!Schema::hasColumn('merits', 'semester')) {
                Schema::table('merits', function (Blueprint $table) {
                    $table->string('semester')->default('2025-2026 1st semester')->after('type');
                });
            }
            
            // Drop and recreate the unique constraint
            Schema::table('merits', function (Blueprint $table) {
                // Drop the old unique constraint if it exists
                try {
                    $table->dropUnique('merits_cadet_id_type_unique');
                } catch (\Exception $e) {
                    // Ignore if it doesn't exist
                }
                
                // Add the new constraint
                $table->unique(['cadet_id', 'type', 'semester']);
            });
        }

        // Add semester column to attendances table
        if (!Schema::hasColumn('attendances', 'semester')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->string('semester')->default('2025-2026 1st semester')->after('user_id');
            });
        }

        // Add semester column to users table for exam scores
        if (!Schema::hasColumn('users', 'semester')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('semester')->default('2025-2026 1st semester')->after('archived');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove semester columns
        Schema::table('merits', function (Blueprint $table) {
            $table->dropUnique(['cadet_id', 'type', 'semester']);
            $table->dropColumn('semester');
            $table->unique(['cadet_id', 'type']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('semester');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('semester');
        });
    }
};
