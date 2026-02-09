<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('training_sessions', 'user_id')) {
            Schema::table('training_sessions', function (Blueprint $table): void {
                $table
                    ->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
            });
        }

        DB::table('training_sessions')
            ->select('training_sessions.id as id', 'training_plans.user_id')
            ->join('training_weeks', 'training_weeks.id', '=', 'training_sessions.training_week_id')
            ->join('training_plans', 'training_plans.id', '=', 'training_weeks.training_plan_id')
            ->whereNull('training_sessions.user_id')
            ->orderBy('training_sessions.id')
            ->chunk(100, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('training_sessions')
                        ->where('id', $row->id)
                        ->update(['user_id' => $row->user_id]);
                }
            });

        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->dropForeign(['training_week_id']);
            $table->foreignId('training_week_id')->nullable()->change();
            $table
                ->foreign('training_week_id')
                ->references('id')
                ->on('training_weeks')
                ->cascadeOnDelete();
            $table->index(['user_id', 'scheduled_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'scheduled_date']);
            $table->dropForeign(['training_week_id']);
            $table->foreignId('training_week_id')->nullable(false)->change();
            $table
                ->foreign('training_week_id')
                ->references('id')
                ->on('training_weeks')
                ->cascadeOnDelete();
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
