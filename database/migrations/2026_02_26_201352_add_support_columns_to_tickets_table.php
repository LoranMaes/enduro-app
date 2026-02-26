<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->string('source', 20)
                ->default('admin')
                ->after('description')
                ->index();

            $table->foreignId('reporter_user_id')
                ->nullable()
                ->after('creator_admin_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->uuid('reporter_user_uuid_id')
                ->nullable()
                ->after('reporter_user_id')
                ->index();

            $table->timestamp('first_admin_response_at')
                ->nullable()
                ->after('done_at')
                ->index();
        });

        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropForeign(['creator_admin_id']);
        });

        Schema::table('tickets', function (Blueprint $table): void {
            $table->unsignedBigInteger('creator_admin_id')
                ->nullable()
                ->change();
            $table->foreign('creator_admin_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }
};
