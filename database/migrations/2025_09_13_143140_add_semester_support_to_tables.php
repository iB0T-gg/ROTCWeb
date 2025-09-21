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
        // Add semester column to merits table
        Schema::table('merits', function (Blueprint $table) {
            $table->string('semester')->default('2025-2026 1st semester')->after('type');
            $table->dropUnique(['cadet_id', 'type']);
            $table->unique(['cadet_id', 'type', 'semester']);
        });

        // Add semester column to attendances table
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('semester')->default('2025-2026 1st semester')->after('user_id');
        });

        // Add semester column to users table for exam scores
        Schema::table('users', function (Blueprint $table) {
            $table->string('semester')->default('2025-2026 1st semester')->after('archived');
        });
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
