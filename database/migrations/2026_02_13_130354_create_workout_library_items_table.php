<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_library_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('sport');
            $table->json('structure_json');
            $table->unsignedInteger('estimated_duration_minutes');
            $table->unsignedInteger('estimated_tss')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'sport']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_library_items');
    }
};
