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
            $table->date('birthday')->nullable();
            $table->string('gender')->nullable();
            $table->integer('age')->nullable();
            $table->string('platoon')->nullable();
            $table->string('company')->nullable();
            $table->string('battalion')->nullable();
            $table->string('blood_type')->nullable();
            $table->string('region')->nullable();
            $table->string('height')->nullable();
            $table->text('address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'birthday',
                'gender', 
                'age',
                'platoon',
                'company',
                'battalion',
                'blood_type',
                'region',
                'height',
                'address'
            ]);
        });
    }
};
