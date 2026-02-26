<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table): void {
                if (! Schema::hasColumn('notifications', 'notifiable_uuid_id')) {
                    $table->uuid('notifiable_uuid_id')
                        ->nullable()
                        ->after('notifiable_id');
                    $table->index(
                        ['notifiable_type', 'notifiable_uuid_id'],
                        'notifications_notifiable_uuid_index',
                    );
                }
            });
        }

        $connection = config('activitylog.database_connection');
        $activityLogTable = (string) config('activitylog.table_name', 'activity_log');
        $schema = Schema::connection($connection);

        if (! $schema->hasTable($activityLogTable)) {
            return;
        }

        $schema->table($activityLogTable, function (Blueprint $table) use ($activityLogTable, $schema): void {
            if (! $schema->hasColumn($activityLogTable, 'subject_uuid_id')) {
                $table->uuid('subject_uuid_id')
                    ->nullable()
                    ->after('subject_id');
                $table->index(['subject_type', 'subject_uuid_id'], 'activity_log_subject_uuid_index');
            }

            if (! $schema->hasColumn($activityLogTable, 'causer_uuid_id')) {
                $table->uuid('causer_uuid_id')
                    ->nullable()
                    ->after('causer_id');
                $table->index(['causer_type', 'causer_uuid_id'], 'activity_log_causer_uuid_index');
            }
        });
    }
};
