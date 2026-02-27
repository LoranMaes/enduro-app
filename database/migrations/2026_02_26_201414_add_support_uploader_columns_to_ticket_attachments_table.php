<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_attachments', function (Blueprint $table): void {
            $table->foreignId('uploaded_by_user_id')
                ->nullable()
                ->after('uploaded_by_admin_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->uuid('uploaded_by_user_uuid_id')
                ->nullable()
                ->after('uploaded_by_user_id')
                ->index();
        });

        Schema::table('ticket_attachments', function (Blueprint $table): void {
            $table->dropForeign(['uploaded_by_admin_id']);
        });

        Schema::table('ticket_attachments', function (Blueprint $table): void {
            $table->unsignedBigInteger('uploaded_by_admin_id')
                ->nullable()
                ->change();
            $table->foreign('uploaded_by_admin_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }
};
