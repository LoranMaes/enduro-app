<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table): void {
                if (! Schema::hasColumn('users', 'email_bidx')) {
                    $table->string('email_bidx', 64)
                        ->nullable()
                        ->after('email');
                    $table->unique('email_bidx');
                }

                if (! Schema::hasColumn('users', 'stripe_customer_id_bidx')) {
                    $table->string('stripe_customer_id_bidx', 64)
                        ->nullable()
                        ->after('stripe_customer_id');
                    $table->index('stripe_customer_id_bidx');
                }
            });
        }

        if (Schema::hasTable('activities')) {
            Schema::table('activities', function (Blueprint $table): void {
                if (! Schema::hasColumn('activities', 'external_id_bidx')) {
                    $table->string('external_id_bidx', 64)
                        ->nullable()
                        ->after('external_id');
                    $table->index('external_id_bidx');
                }
            });
        }

        if (Schema::hasTable('activity_provider_connections')) {
            Schema::table('activity_provider_connections', function (Blueprint $table): void {
                if (! Schema::hasColumn('activity_provider_connections', 'provider_athlete_id_bidx')) {
                    $table->string('provider_athlete_id_bidx', 64)
                        ->nullable()
                        ->after('provider_athlete_id');
                    $table->index(
                        ['provider', 'provider_athlete_id_bidx'],
                        'activity_provider_connections_provider_athlete_id_bidx_idx',
                    );
                }
            });
        }
    }
};
