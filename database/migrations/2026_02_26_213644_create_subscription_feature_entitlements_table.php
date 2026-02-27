<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_feature_entitlements', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid_id')->unique();
            $table->string('public_id', 512)->unique();
            $table->string('key')->unique();
            $table->boolean('athlete_free_enabled')->nullable();
            $table->boolean('athlete_paid_enabled')->nullable();
            $table->boolean('coach_paid_enabled')->nullable();
            $table->foreignId('updated_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('updated_by_admin_uuid_id')->nullable()->index();
            $table->timestamps();
        });
    }
};
