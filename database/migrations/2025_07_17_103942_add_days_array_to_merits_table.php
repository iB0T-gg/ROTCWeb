<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('merits', function (Blueprint $table) {
            $table->json('days_array')->nullable();
        });
    }
 
    public function down()
    {
        Schema::table('merits', function (Blueprint $table) {
            $table->dropColumn('days_array');
        });
    }
};
