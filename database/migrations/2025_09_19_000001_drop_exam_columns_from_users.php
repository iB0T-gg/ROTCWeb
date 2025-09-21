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
            if (Schema::hasColumn('users', 'midterm_exam')) {
                $table->dropColumn('midterm_exam');
            }
            if (Schema::hasColumn('users', 'final_exam')) {
                $table->dropColumn('final_exam');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('midterm_exam')->nullable();
            $table->integer('final_exam')->nullable();
        });
    }
};


