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
        Schema::create('activity_provider_webhook_events', function (Blueprint $table): void {
            $table->id();
            $table->string('provider');
            $table->string('external_event_id')->nullable();
            $table->string('object_type')->nullable();
            $table->string('object_id')->nullable();
            $table->string('aspect_type')->nullable();
            $table->string('owner_id')->nullable();
            $table->string('status')->default('received');
            $table->text('reason')->nullable();
            $table->string('payload_hash');
            $table->json('payload');
            $table->timestamp('received_at');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['provider', 'payload_hash'],
                'activity_provider_webhook_events_provider_hash_unique',
            );
            $table->index(['provider', 'status']);
            $table->index(['provider', 'owner_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_provider_webhook_events');
    }
};
