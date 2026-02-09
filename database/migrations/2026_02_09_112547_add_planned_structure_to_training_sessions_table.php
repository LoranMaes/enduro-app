<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('training_sessions', 'planned_structure')) {
            return;
        }

        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->json('planned_structure')
                ->nullable()
                ->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('training_sessions', 'planned_structure')) {
            return;
        }

        Schema::table('training_sessions', function (Blueprint $table): void {
            $table->dropColumn('planned_structure');
        });
    }
};
