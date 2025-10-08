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
            $table->string('merits_week_11')->nullable()->after('demerits_week_10');
            $table->string('demerits_week_11')->nullable()->after('merits_week_11');
            $table->string('merits_week_12')->nullable()->after('demerits_week_11');
            $table->string('demerits_week_12')->nullable()->after('merits_week_12');
            $table->string('merits_week_13')->nullable()->after('demerits_week_12');
            $table->string('demerits_week_13')->nullable()->after('merits_week_13');
            $table->string('merits_week_14')->nullable()->after('demerits_week_13');
            $table->string('demerits_week_14')->nullable()->after('merits_week_14');
            $table->string('merits_week_15')->nullable()->after('demerits_week_14');
            $table->string('demerits_week_15')->nullable()->after('merits_week_15');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn([
                'merits_week_11', 'demerits_week_11',
                'merits_week_12', 'demerits_week_12',
                'merits_week_13', 'demerits_week_13',
                'merits_week_14', 'demerits_week_14',
                'merits_week_15', 'demerits_week_15'
            ]);
        });
    }
};
