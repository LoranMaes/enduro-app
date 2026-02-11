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
        Schema::create('ticket_internal_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();
            $table->foreignId('admin_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->longText('content')->nullable();
            $table->timestamps();

            $table->unique(['ticket_id', 'admin_id'], 'ticket_internal_notes_unique_admin_note');
            $table->index(['admin_id', 'updated_at'], 'ticket_internal_notes_admin_updated_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_internal_notes');
    }
};
