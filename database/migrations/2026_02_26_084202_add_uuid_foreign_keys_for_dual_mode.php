<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $relationships = [
            ['table' => 'sessions', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'users', 'column' => 'suspended_by_user_id', 'uuid_column' => 'suspended_by_user_uuid_id'],
            ['table' => 'athlete_profiles', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'coach_profiles', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'training_plans', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'training_weeks', 'column' => 'training_plan_id', 'uuid_column' => 'training_plan_uuid_id'],
            ['table' => 'training_sessions', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'training_sessions', 'column' => 'training_week_id', 'uuid_column' => 'training_week_uuid_id'],
            ['table' => 'activities', 'column' => 'training_session_id', 'uuid_column' => 'training_session_uuid_id'],
            ['table' => 'activities', 'column' => 'athlete_id', 'uuid_column' => 'athlete_uuid_id'],
            ['table' => 'coach_athlete_assignments', 'column' => 'coach_id', 'uuid_column' => 'coach_uuid_id'],
            ['table' => 'coach_athlete_assignments', 'column' => 'athlete_id', 'uuid_column' => 'athlete_uuid_id'],
            ['table' => 'coach_applications', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'coach_applications', 'column' => 'reviewed_by_user_id', 'uuid_column' => 'reviewed_by_user_uuid_id'],
            ['table' => 'coach_application_files', 'column' => 'coach_application_id', 'uuid_column' => 'coach_application_uuid_id'],
            ['table' => 'activity_provider_connections', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'activity_provider_sync_runs', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'calendar_entries', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'goals', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'annual_training_plans', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'annual_training_plan_weeks', 'column' => 'annual_training_plan_id', 'uuid_column' => 'annual_training_plan_uuid_id'],
            ['table' => 'workout_library_items', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'training_load_snapshots', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'athlete_week_metrics', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id'],
            ['table' => 'tickets', 'column' => 'assignee_admin_id', 'uuid_column' => 'assignee_admin_uuid_id'],
            ['table' => 'tickets', 'column' => 'creator_admin_id', 'uuid_column' => 'creator_admin_uuid_id'],
            ['table' => 'ticket_comments', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id'],
            ['table' => 'ticket_comments', 'column' => 'admin_id', 'uuid_column' => 'admin_uuid_id'],
            ['table' => 'ticket_internal_notes', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id'],
            ['table' => 'ticket_internal_notes', 'column' => 'admin_id', 'uuid_column' => 'admin_uuid_id'],
            ['table' => 'ticket_mentions', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id'],
            ['table' => 'ticket_mentions', 'column' => 'ticket_comment_id', 'uuid_column' => 'ticket_comment_uuid_id'],
            ['table' => 'ticket_mentions', 'column' => 'mentioned_admin_id', 'uuid_column' => 'mentioned_admin_uuid_id'],
            ['table' => 'ticket_mentions', 'column' => 'mentioned_by_admin_id', 'uuid_column' => 'mentioned_by_admin_uuid_id'],
            ['table' => 'ticket_attachments', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id'],
            ['table' => 'ticket_attachments', 'column' => 'uploaded_by_admin_id', 'uuid_column' => 'uploaded_by_admin_uuid_id'],
            ['table' => 'ticket_audit_logs', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id'],
            ['table' => 'ticket_audit_logs', 'column' => 'actor_admin_id', 'uuid_column' => 'actor_admin_uuid_id'],
            ['table' => 'entry_type_entitlements', 'column' => 'updated_by_admin_id', 'uuid_column' => 'updated_by_admin_uuid_id'],
        ];

        foreach ($relationships as $relationship) {
            $tableName = $relationship['table'];
            $legacyColumn = $relationship['column'];
            $uuidColumn = $relationship['uuid_column'];

            if (! Schema::hasTable($tableName)) {
                continue;
            }

            if (! Schema::hasColumn($tableName, $legacyColumn)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName, $legacyColumn, $uuidColumn): void {
                if (Schema::hasColumn($tableName, $uuidColumn)) {
                    return;
                }

                $table->uuid($uuidColumn)
                    ->nullable()
                    ->after($legacyColumn);
                $table->index($uuidColumn);
            });
        }
    }
};
