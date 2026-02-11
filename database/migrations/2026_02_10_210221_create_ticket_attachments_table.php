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
        Schema::create('ticket_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();
            $table->foreignId('uploaded_by_admin_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('original_name');
            $table->string('display_name', 180);
            $table->string('extension', 20)->nullable();
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('stored_disk', 40);
            $table->string('stored_path');
            $table->timestamps();

            $table->index(['ticket_id', 'created_at'], 'ticket_attachments_ticket_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_attachments');
    }
};
