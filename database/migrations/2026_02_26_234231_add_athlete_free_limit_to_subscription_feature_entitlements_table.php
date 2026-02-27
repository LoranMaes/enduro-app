<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('subscription_feature_entitlements')) {
            return;
        }

        if (Schema::hasColumn('subscription_feature_entitlements', 'athlete_free_limit')) {
            return;
        }

        Schema::table('subscription_feature_entitlements', function (Blueprint $table) {
            $table->unsignedSmallInteger('athlete_free_limit')->nullable()->after('athlete_free_enabled');
        });
    }
};
