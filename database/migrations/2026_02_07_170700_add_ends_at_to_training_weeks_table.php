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
        Schema::table('training_weeks', function (Blueprint $table): void {
            $table->date('ends_at')->nullable()->after('starts_at');
        });

        DB::table('training_weeks')->update([
            'ends_at' => DB::raw('DATE_ADD(starts_at, INTERVAL 6 DAY)'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_weeks', function (Blueprint $table): void {
            $table->dropColumn('ends_at');
        });
    }
};
