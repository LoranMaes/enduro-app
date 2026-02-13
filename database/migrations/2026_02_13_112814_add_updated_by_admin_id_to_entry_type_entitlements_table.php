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
        Schema::table('entry_type_entitlements', function (Blueprint $table) {
            $table->foreignId('updated_by_admin_id')
                ->nullable()
                ->after('requires_subscription')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entry_type_entitlements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('updated_by_admin_id');
        });
    }
};
