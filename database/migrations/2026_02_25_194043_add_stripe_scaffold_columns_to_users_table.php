<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('stripe_customer_id')
                ->nullable()
                ->after('is_subscribed');
            $table->string('stripe_subscription_status')
                ->nullable()
                ->after('stripe_customer_id');
            $table->timestamp('stripe_subscription_synced_at')
                ->nullable()
                ->after('stripe_subscription_status');

            $table->index('stripe_customer_id');
            $table->index('stripe_subscription_status');
        });
    }
};
