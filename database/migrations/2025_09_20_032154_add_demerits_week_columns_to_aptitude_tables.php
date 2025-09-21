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
        // Add demerits columns to first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->string('demerits_week_1')->nullable()->after('merits_week_1');
            $table->string('demerits_week_2')->nullable()->after('merits_week_2');
            $table->string('demerits_week_3')->nullable()->after('merits_week_3');
            $table->string('demerits_week_4')->nullable()->after('merits_week_4');
            $table->string('demerits_week_5')->nullable()->after('merits_week_5');
            $table->string('demerits_week_6')->nullable()->after('merits_week_6');
            $table->string('demerits_week_7')->nullable()->after('merits_week_7');
            $table->string('demerits_week_8')->nullable()->after('merits_week_8');
            $table->string('demerits_week_9')->nullable()->after('merits_week_9');
            $table->string('demerits_week_10')->nullable()->after('merits_week_10');
            $table->string('demerits_week_11')->nullable()->after('merits_week_11');
            $table->string('demerits_week_12')->nullable()->after('merits_week_12');
            $table->string('demerits_week_13')->nullable()->after('merits_week_13');
            $table->string('demerits_week_14')->nullable()->after('merits_week_14');
            $table->string('demerits_week_15')->nullable()->after('merits_week_15');
        });

        // Add demerits columns to second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->string('demerits_week_1')->nullable()->after('merits_week_1');
            $table->string('demerits_week_2')->nullable()->after('merits_week_2');
            $table->string('demerits_week_3')->nullable()->after('merits_week_3');
            $table->string('demerits_week_4')->nullable()->after('merits_week_4');
            $table->string('demerits_week_5')->nullable()->after('merits_week_5');
            $table->string('demerits_week_6')->nullable()->after('merits_week_6');
            $table->string('demerits_week_7')->nullable()->after('merits_week_7');
            $table->string('demerits_week_8')->nullable()->after('merits_week_8');
            $table->string('demerits_week_9')->nullable()->after('merits_week_9');
            $table->string('demerits_week_10')->nullable()->after('merits_week_10');
            $table->string('demerits_week_11')->nullable()->after('merits_week_11');
            $table->string('demerits_week_12')->nullable()->after('merits_week_12');
            $table->string('demerits_week_13')->nullable()->after('merits_week_13');
            $table->string('demerits_week_14')->nullable()->after('merits_week_14');
            $table->string('demerits_week_15')->nullable()->after('merits_week_15');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove demerits columns from first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn([
                'demerits_week_1', 'demerits_week_2', 'demerits_week_3', 'demerits_week_4', 'demerits_week_5',
                'demerits_week_6', 'demerits_week_7', 'demerits_week_8', 'demerits_week_9', 'demerits_week_10',
                'demerits_week_11', 'demerits_week_12', 'demerits_week_13', 'demerits_week_14', 'demerits_week_15'
            ]);
        });

        // Remove demerits columns from second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->dropColumn([
                'demerits_week_1', 'demerits_week_2', 'demerits_week_3', 'demerits_week_4', 'demerits_week_5',
                'demerits_week_6', 'demerits_week_7', 'demerits_week_8', 'demerits_week_9', 'demerits_week_10',
                'demerits_week_11', 'demerits_week_12', 'demerits_week_13', 'demerits_week_14', 'demerits_week_15'
            ]);
        });
    }
};
