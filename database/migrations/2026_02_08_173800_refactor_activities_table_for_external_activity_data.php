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
        Schema::table('activities', function (Blueprint $table): void {
            $table->renameColumn('source', 'provider');
        });

        Schema::table('activities', function (Blueprint $table): void {
            $table->foreignId('athlete_id')->nullable()->after('training_session_id')->constrained('users')->cascadeOnDelete();
            $table->string('sport')->nullable()->after('provider');
            $table->timestamp('started_at')->nullable()->after('sport');
            $table->unsignedInteger('duration_seconds')->nullable()->after('started_at');
            $table->decimal('distance_meters', 10, 2)->unsigned()->nullable()->after('duration_seconds');
            $table->decimal('elevation_gain_meters', 10, 2)->unsigned()->nullable()->after('distance_meters');
            $table->foreignId('training_session_id')->nullable()->change();

            $table->unique(
                ['athlete_id', 'provider', 'external_id'],
                'activities_athlete_provider_external_unique',
            );
            $table->index(['athlete_id', 'provider']);
            $table->index('started_at');
        });

        DB::statement('
            UPDATE activities
            INNER JOIN training_sessions ON training_sessions.id = activities.training_session_id
            INNER JOIN training_weeks ON training_weeks.id = training_sessions.training_week_id
            INNER JOIN training_plans ON training_plans.id = training_weeks.training_plan_id
            SET activities.athlete_id = training_plans.user_id
            WHERE activities.athlete_id IS NULL
        ');

        DB::table('activities')
            ->whereNull('sport')
            ->update([
                'sport' => 'other',
            ]);

        DB::table('activities')
            ->whereNull('duration_seconds')
            ->update([
                'duration_seconds' => 0,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table): void {
            $table->dropUnique('activities_athlete_provider_external_unique');
            $table->dropIndex('activities_athlete_id_provider_index');
            $table->dropIndex('activities_started_at_index');

            $table->dropConstrainedForeignId('athlete_id');
            $table->dropColumn([
                'sport',
                'started_at',
                'duration_seconds',
                'distance_meters',
                'elevation_gain_meters',
            ]);
            $table->foreignId('training_session_id')->nullable(false)->change();
        });

        Schema::table('activities', function (Blueprint $table): void {
            $table->renameColumn('provider', 'source');
        });
    }
};
