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
        Schema::create('merits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cadet_id')->constrained('users')->onDelete('cascade');
            $table->string('type')->default('military_attitude'); // For future expansion
            $table->integer('day_1')->nullable();
            $table->integer('day_2')->nullable();
            $table->integer('day_3')->nullable();
            $table->integer('day_4')->nullable();
            $table->integer('day_5')->nullable();
            $table->integer('day_6')->nullable();
            $table->integer('day_7')->nullable();
            $table->integer('day_8')->nullable();
            $table->integer('day_9')->nullable();
            $table->integer('day_10')->nullable();
            $table->integer('day_11')->nullable();
            $table->integer('day_12')->nullable();
            $table->integer('day_13')->nullable();
            $table->integer('day_14')->nullable();
            $table->integer('day_15')->nullable();
            $table->integer('percentage')->default(30);
            $table->foreignId('updated_by')->nullable()->constrained('users'); // Faculty who updated
            $table->timestamps();
            
            // Ensure one merit record per cadet per type
            $table->unique(['cadet_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('merits');
    }
};
