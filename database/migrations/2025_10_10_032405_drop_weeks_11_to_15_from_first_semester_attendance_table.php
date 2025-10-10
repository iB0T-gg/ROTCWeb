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
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            // Drop weeks 11-15 columns from first semester attendance table
            // since 1st semester only uses 10 weeks
            for ($i = 11; $i <= 15; $i++) {
                $table->dropColumn("week_{$i}");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_attendance', function (Blueprint $table) {
            // Re-add weeks 11-15 columns if migration is rolled back
            for ($i = 11; $i <= 15; $i++) {
                $table->boolean("week_{$i}")->default(false);
            }
        });
    }
};
