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
        Schema::create('coach_application_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_application_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('stored_disk', 40)->default('local');
            $table->string('stored_path');
            $table->string('original_name', 255);
            $table->string('display_name', 255);
            $table->string('extension', 20)->nullable();
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['coach_application_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coach_application_files');
    }
};
