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
        // First, clean up existing data that doesn't match the constraint
        DB::table('first_semester_common_grade_module')
            ->where('semester', '!=', '2025-2026 1st semester')
            ->delete();
        
        // Add check constraint to restrict semester to '2025-2026 1st semester' only
        DB::statement("ALTER TABLE first_semester_common_grade_module ADD CONSTRAINT chk_semester_first_only CHECK (semester = '2025-2026 1st semester')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the check constraint
        DB::statement("ALTER TABLE first_semester_common_grade_module DROP CONSTRAINT chk_semester_first_only");
    }
};
