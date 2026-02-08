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
        Schema::table('users', function (Blueprint $table): void {
            $table->text('strava_access_token')->nullable()->after('remember_token');
            $table->text('strava_refresh_token')->nullable()->after('strava_access_token');
            $table->timestamp('strava_token_expires_at')->nullable()->after('strava_refresh_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'strava_access_token',
                'strava_refresh_token',
                'strava_token_expires_at',
            ]);
        });
    }
};
