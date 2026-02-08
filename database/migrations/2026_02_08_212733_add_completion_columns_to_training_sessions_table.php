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
        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->unsignedInteger('actual_duration_minutes')
                ->nullable()
                ->after('duration_minutes');
            $table->timestamp('completed_at')
                ->nullable()
                ->after('actual_tss');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->dropColumn([
                'actual_duration_minutes',
                'completed_at',
            ]);
        });
    }
};
