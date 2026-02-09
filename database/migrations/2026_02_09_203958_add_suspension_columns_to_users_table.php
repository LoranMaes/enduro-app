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
            $table->timestamp('suspended_at')->nullable()->after('remember_token');
            $table->foreignId('suspended_by_user_id')->nullable()->after('suspended_at')->constrained('users')->nullOnDelete();
            $table->text('suspension_reason')->nullable()->after('suspended_by_user_id');
            $table->index('suspended_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['suspended_at']);
            $table->dropConstrainedForeignId('suspended_by_user_id');
            $table->dropColumn(['suspended_at', 'suspension_reason']);
        });
    }
};
