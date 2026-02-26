<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'users',
            'athlete_profiles',
            'coach_profiles',
            'training_plans',
            'training_weeks',
            'training_sessions',
            'activities',
            'coach_athlete_assignments',
            'coach_applications',
            'coach_application_files',
            'activity_provider_connections',
            'activity_provider_sync_runs',
            'activity_provider_webhook_events',
            'calendar_entries',
            'goals',
            'annual_training_plans',
            'annual_training_plan_weeks',
            'workout_library_items',
            'training_load_snapshots',
            'athlete_week_metrics',
            'tickets',
            'ticket_comments',
            'ticket_internal_notes',
            'ticket_mentions',
            'ticket_attachments',
            'ticket_audit_logs',
            'entry_type_entitlements',
            'admin_settings',
        ];

        foreach ($tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (! Schema::hasColumn($tableName, 'uuid_id')) {
                    $table->uuid('uuid_id')
                        ->nullable()
                        ->after('id');
                    $table->unique('uuid_id');
                }

                if (! Schema::hasColumn($tableName, 'public_id')) {
                    $table->string('public_id', 512)
                        ->nullable()
                        ->after('uuid_id');
                    $table->unique('public_id');
                }
            });
        }
    }
};
