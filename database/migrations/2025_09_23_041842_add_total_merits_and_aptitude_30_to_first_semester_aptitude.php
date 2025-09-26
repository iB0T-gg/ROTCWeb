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
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->integer('total_merits')->default(0)->after('percentage');
            $table->decimal('aptitude_30', 5, 2)->default(0.00)->after('total_merits');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn(['total_merits', 'aptitude_30']);
        });
    }
};