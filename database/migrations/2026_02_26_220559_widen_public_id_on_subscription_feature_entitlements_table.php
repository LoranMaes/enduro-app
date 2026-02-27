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

        if (! Schema::hasColumn('subscription_feature_entitlements', 'public_id')) {
            return;
        }

        Schema::table('subscription_feature_entitlements', function (Blueprint $table): void {
            $table->string('public_id', 512)->change();
        });
    }
};
