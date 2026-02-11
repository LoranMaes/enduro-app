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
        Schema::create('tickets', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 180);
            $table->json('description')->nullable();
            $table->string('status', 40)->default('todo')->index();
            $table->string('type', 40)->default('feature')->index();
            $table->string('importance', 40)->default('normal')->index();
            $table->foreignId('assignee_admin_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('creator_admin_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamp('done_at')->nullable()->index();
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();

            $table->index(
                ['status', 'archived_at', 'assignee_admin_id'],
                'tickets_status_archive_assignee_idx',
            );
            $table->index(
                ['creator_admin_id', 'archived_at'],
                'tickets_creator_archive_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
