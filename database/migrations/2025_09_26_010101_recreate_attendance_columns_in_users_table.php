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
            // Drop existing columns if they exist
            if (Schema::hasColumn('users', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('users', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            // Recreate the columns with proper structure
            $table->integer('weeks_present')->default(0)->after('final_grade');
            $table->decimal('attendance_30', 8, 2)->default(0.00)->after('weeks_present');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'weeks_present')) {
                $table->dropColumn('weeks_present');
            }
            if (Schema::hasColumn('users', 'attendance_30')) {
                $table->dropColumn('attendance_30');
            }
        });
    }
};