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
        Schema::create('ticket_mentions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')
                ->nullable()
                ->constrained('tickets')
                ->cascadeOnDelete();
            $table->foreignId('ticket_comment_id')
                ->nullable()
                ->constrained('ticket_comments')
                ->cascadeOnDelete();
            $table->foreignId('mentioned_admin_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('mentioned_by_admin_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('source', 40)->default('description');
            $table->timestamps();

            $table->index(['mentioned_admin_id', 'created_at'], 'ticket_mentions_admin_created_idx');
            $table->unique(
                ['ticket_id', 'ticket_comment_id', 'mentioned_admin_id', 'mentioned_by_admin_id', 'source'],
                'ticket_mentions_unique_reference',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_mentions');
    }
};
