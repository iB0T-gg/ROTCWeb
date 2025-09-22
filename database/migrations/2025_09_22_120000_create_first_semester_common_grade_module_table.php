<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('first_semester_common_grade_module', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('semester')->default('2025-2026 1st semester');
            $table->decimal('common_module_grade', 5, 2)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'semester']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('first_semester_common_grade_module');
    }
};


