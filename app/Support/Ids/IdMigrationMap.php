<?php

namespace App\Support\Ids;

class IdMigrationMap
{
    /**
     * @return list<string>
     */
    public function uuidEntityTables(): array
    {
        return [
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
    }

    /**
     * @return list<string>
     */
    public function publicIdEntityTables(): array
    {
        return $this->uuidEntityTables();
    }

    /**
     * @return array<int, array{
     *     table: string,
     *     column: string,
     *     uuid_column: string,
     *     parent_table: string
     * }>
     */
    public function foreignUuidRelationships(): array
    {
        return [
            ['table' => 'sessions', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'users', 'column' => 'suspended_by_user_id', 'uuid_column' => 'suspended_by_user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'athlete_profiles', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_profiles', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'training_plans', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'training_weeks', 'column' => 'training_plan_id', 'uuid_column' => 'training_plan_uuid_id', 'parent_table' => 'training_plans'],
            ['table' => 'training_sessions', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'training_sessions', 'column' => 'training_week_id', 'uuid_column' => 'training_week_uuid_id', 'parent_table' => 'training_weeks'],
            ['table' => 'activities', 'column' => 'training_session_id', 'uuid_column' => 'training_session_uuid_id', 'parent_table' => 'training_sessions'],
            ['table' => 'activities', 'column' => 'athlete_id', 'uuid_column' => 'athlete_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_athlete_assignments', 'column' => 'coach_id', 'uuid_column' => 'coach_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_athlete_assignments', 'column' => 'athlete_id', 'uuid_column' => 'athlete_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_applications', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_applications', 'column' => 'reviewed_by_user_id', 'uuid_column' => 'reviewed_by_user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'coach_application_files', 'column' => 'coach_application_id', 'uuid_column' => 'coach_application_uuid_id', 'parent_table' => 'coach_applications'],
            ['table' => 'activity_provider_connections', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'activity_provider_sync_runs', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'calendar_entries', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'goals', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'annual_training_plans', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'annual_training_plan_weeks', 'column' => 'annual_training_plan_id', 'uuid_column' => 'annual_training_plan_uuid_id', 'parent_table' => 'annual_training_plans'],
            ['table' => 'workout_library_items', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'training_load_snapshots', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'athlete_week_metrics', 'column' => 'user_id', 'uuid_column' => 'user_uuid_id', 'parent_table' => 'users'],
            ['table' => 'tickets', 'column' => 'assignee_admin_id', 'uuid_column' => 'assignee_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'tickets', 'column' => 'creator_admin_id', 'uuid_column' => 'creator_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_comments', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id', 'parent_table' => 'tickets'],
            ['table' => 'ticket_comments', 'column' => 'admin_id', 'uuid_column' => 'admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_internal_notes', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id', 'parent_table' => 'tickets'],
            ['table' => 'ticket_internal_notes', 'column' => 'admin_id', 'uuid_column' => 'admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_mentions', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id', 'parent_table' => 'tickets'],
            ['table' => 'ticket_mentions', 'column' => 'ticket_comment_id', 'uuid_column' => 'ticket_comment_uuid_id', 'parent_table' => 'ticket_comments'],
            ['table' => 'ticket_mentions', 'column' => 'mentioned_admin_id', 'uuid_column' => 'mentioned_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_mentions', 'column' => 'mentioned_by_admin_id', 'uuid_column' => 'mentioned_by_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_attachments', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id', 'parent_table' => 'tickets'],
            ['table' => 'ticket_attachments', 'column' => 'uploaded_by_admin_id', 'uuid_column' => 'uploaded_by_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'ticket_audit_logs', 'column' => 'ticket_id', 'uuid_column' => 'ticket_uuid_id', 'parent_table' => 'tickets'],
            ['table' => 'ticket_audit_logs', 'column' => 'actor_admin_id', 'uuid_column' => 'actor_admin_uuid_id', 'parent_table' => 'users'],
            ['table' => 'entry_type_entitlements', 'column' => 'updated_by_admin_id', 'uuid_column' => 'updated_by_admin_uuid_id', 'parent_table' => 'users'],
        ];
    }

    /**
     * @return list<array{table: string, column: string, index: string, unique: bool}>
     */
    public function blindIndexColumns(): array
    {
        return [
            ['table' => 'users', 'column' => 'email_bidx', 'index' => 'users_email_bidx_unique', 'unique' => true],
            ['table' => 'users', 'column' => 'stripe_customer_id_bidx', 'index' => 'users_stripe_customer_id_bidx_index', 'unique' => false],
            ['table' => 'activities', 'column' => 'external_id_bidx', 'index' => 'activities_external_id_bidx_index', 'unique' => false],
            ['table' => 'activity_provider_connections', 'column' => 'provider_athlete_id_bidx', 'index' => 'activity_provider_connections_provider_athlete_id_bidx_idx', 'unique' => false],
        ];
    }
}
