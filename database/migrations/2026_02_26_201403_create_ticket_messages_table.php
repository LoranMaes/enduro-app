<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_messages', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid_id')->nullable()->unique();
            $table->string('public_id', 512)->nullable()->unique();
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();
            $table->uuid('ticket_uuid_id')->nullable()->index();
            $table->foreignId('author_user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->uuid('author_user_uuid_id')->nullable()->index();
            $table->longText('body');
            $table->timestamps();

            $table->index(
                ['ticket_id', 'created_at'],
                'ticket_messages_ticket_created_idx',
            );
        });
    }
};
