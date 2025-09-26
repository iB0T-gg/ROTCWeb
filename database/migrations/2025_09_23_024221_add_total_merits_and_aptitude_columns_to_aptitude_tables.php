<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('first_semester_aptitude', function (Blueprint $table) {
        $table->integer('total_merits')->default(0)->after('demerits_week_10');
        $table->decimal('aptitude_30', 5, 2)->default(0)->after('total_merits');
    });

    Schema::table('second_semester_aptitude', function (Blueprint $table) {
        $table->integer('total_merits')->default(0)->after('demerits_week_15');
        $table->decimal('aptitude_30', 5, 2)->default(0)->after('total_merits');
    });

    // Backfill using existing week columns and percentage
    DB::statement("
        UPDATE first_semester_aptitude
        SET total_merits = GREATEST(
            COALESCE(merits_week_1,0)-COALESCE(demerits_week_1,0) +
            COALESCE(merits_week_2,0)-COALESCE(demerits_week_2,0) +
            COALESCE(merits_week_3,0)-COALESCE(demerits_week_3,0) +
            COALESCE(merits_week_4,0)-COALESCE(demerits_week_4,0) +
            COALESCE(merits_week_5,0)-COALESCE(demerits_week_5,0) +
            COALESCE(merits_week_6,0)-COALESCE(demerits_week_6,0) +
            COALESCE(merits_week_7,0)-COALESCE(demerits_week_7,0) +
            COALESCE(merits_week_8,0)-COALESCE(demerits_week_8,0) +
            COALESCE(merits_week_9,0)-COALESCE(demerits_week_9,0) +
            COALESCE(merits_week_10,0)-COALESCE(demerits_week_10,0), 0),
            aptitude_30 = ROUND(LEAST(30, COALESCE(percentage,0)), 2)
    ");

    DB::statement("
        UPDATE second_semester_aptitude
        SET total_merits = GREATEST(
            COALESCE(merits_week_1,0)-COALESCE(demerits_week_1,0) +
            COALESCE(merits_week_2,0)-COALESCE(demerits_week_2,0) +
            COALESCE(merits_week_3,0)-COALESCE(demerits_week_3,0) +
            COALESCE(merits_week_4,0)-COALESCE(demerits_week_4,0) +
            COALESCE(merits_week_5,0)-COALESCE(demerits_week_5,0) +
            COALESCE(merits_week_6,0)-COALESCE(demerits_week_6,0) +
            COALESCE(merits_week_7,0)-COALESCE(demerits_week_7,0) +
            COALESCE(merits_week_8,0)-COALESCE(demerits_week_8,0) +
            COALESCE(merits_week_9,0)-COALESCE(demerits_week_9,0) +
            COALESCE(merits_week_10,0)-COALESCE(demerits_week_10,0) +
            COALESCE(merits_week_11,0)-COALESCE(demerits_week_11,0) +
            COALESCE(merits_week_12,0)-COALESCE(demerits_week_12,0) +
            COALESCE(merits_week_13,0)-COALESCE(demerits_week_13,0) +
            COALESCE(merits_week_14,0)-COALESCE(demerits_week_14,0) +
            COALESCE(merits_week_15,0)-COALESCE(demerits_week_15,0), 0),
            aptitude_30 = ROUND(LEAST(30, COALESCE(percentage,0)), 2)
    ");

    // Once app code uses aptitude_30 everywhere, drop the old column:
    Schema::table('first_semester_aptitude', function (Blueprint $table) {
        $table->dropColumn('percentage');
    });
    Schema::table('second_semester_aptitude', function (Blueprint $table) {
        $table->dropColumn('percentage');
    });
}

public function down(): void
{
    Schema::table('first_semester_aptitude', function (Blueprint $table) {
        $table->decimal('percentage', 5, 2)->default(0)->after('merits_week_10');
        $table->dropColumn(['aptitude_30','total_merits']);
    });
    Schema::table('second_semester_aptitude', function (Blueprint $table) {
        $table->decimal('percentage', 5, 2)->default(0)->after('merits_week_15');
        $table->dropColumn(['aptitude_30','total_merits']);
    });
}
};
