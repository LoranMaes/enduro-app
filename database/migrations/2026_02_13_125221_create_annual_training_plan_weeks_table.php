<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annual_training_plan_weeks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('annual_training_plan_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->date('week_start_date');
            $table->string('week_type')->default('build');
            $table->string('priority')->default('normal');
            $table->text('notes')->nullable();
            $table->unsignedInteger('planned_minutes')->default(0);
            $table->unsignedInteger('completed_minutes')->default(0);
            $table->unsignedInteger('planned_tss')->nullable();
            $table->unsignedInteger('completed_tss')->nullable();
            $table->timestamps();

            $table->unique(
                ['annual_training_plan_id', 'week_start_date'],
                'atp_weeks_plan_week_unique',
            );
            $table->index(['week_start_date'], 'atp_weeks_week_start_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annual_training_plan_weeks');
    }
};
