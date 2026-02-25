<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('athlete_week_metrics', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->date('week_start_date');
            $table->date('week_end_date');
            $table->unsignedInteger('planned_sessions_count')
                ->default(0);
            $table->unsignedInteger('planned_completed_count')
                ->default(0);
            $table->unsignedInteger('planned_minutes_total')
                ->default(0);
            $table->unsignedInteger('completed_minutes_total')
                ->default(0);
            $table->unsignedInteger('planned_tss_total')
                ->default(0);
            $table->unsignedInteger('completed_tss_total')
                ->default(0);
            $table->string('load_state')
                ->default('insufficient');
            $table->float('load_state_ratio')
                ->nullable();
            $table->string('load_state_source')
                ->default('planned_completed_tss_ratio');
            $table->timestamps();

            $table->unique(['user_id', 'week_start_date']);
            $table->index(['user_id', 'week_end_date']);
        });
    }
};
