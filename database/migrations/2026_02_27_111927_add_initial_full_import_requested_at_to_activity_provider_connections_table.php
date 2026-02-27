<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_provider_connections', function (Blueprint $table): void {
            if (! Schema::hasColumn('activity_provider_connections', 'initial_full_import_requested_at')) {
                $table->timestamp('initial_full_import_requested_at')
                    ->nullable()
                    ->after('last_synced_at')
                    ->index('apc_initial_full_import_requested_at_idx');
            }
        });
    }
};
