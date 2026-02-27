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
            $table->string('planning_source')
                ->default('planned')
                ->after('status');
            $table->string('completion_source')
                ->nullable()
                ->after('completed_at');
            $table->timestamp('auto_completed_at')
                ->nullable()
                ->after('completion_source');
            $table->index(['user_id', 'planning_source']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'planning_source']);
            $table->dropColumn([
                'planning_source',
                'completion_source',
                'auto_completed_at',
            ]);
        });
    }
};
