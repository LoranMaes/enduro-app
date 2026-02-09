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
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'timezone')) {
                $table->string('timezone', 120)
                    ->nullable()
                    ->after('role');
            }

            if (! Schema::hasColumn('users', 'unit_system')) {
                $table->string('unit_system', 20)
                    ->nullable()
                    ->after('timezone');
            }
        });

        Schema::table('athlete_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('athlete_profiles', 'primary_sport')) {
                $table->string('primary_sport', 40)
                    ->nullable()
                    ->after('height');
            }

            if (! Schema::hasColumn('athlete_profiles', 'weekly_training_days')) {
                $table->unsignedTinyInteger('weekly_training_days')
                    ->nullable()
                    ->after('primary_sport');
            }

            if (! Schema::hasColumn('athlete_profiles', 'preferred_rest_day')) {
                $table->string('preferred_rest_day', 20)
                    ->nullable()
                    ->after('weekly_training_days');
            }

            if (! Schema::hasColumn('athlete_profiles', 'intensity_distribution')) {
                $table->string('intensity_distribution', 40)
                    ->nullable()
                    ->after('preferred_rest_day');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athlete_profiles', function (Blueprint $table): void {
            if (Schema::hasColumn('athlete_profiles', 'intensity_distribution')) {
                $table->dropColumn('intensity_distribution');
            }

            if (Schema::hasColumn('athlete_profiles', 'preferred_rest_day')) {
                $table->dropColumn('preferred_rest_day');
            }

            if (Schema::hasColumn('athlete_profiles', 'weekly_training_days')) {
                $table->dropColumn('weekly_training_days');
            }

            if (Schema::hasColumn('athlete_profiles', 'primary_sport')) {
                $table->dropColumn('primary_sport');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'unit_system')) {
                $table->dropColumn('unit_system');
            }

            if (Schema::hasColumn('users', 'timezone')) {
                $table->dropColumn('timezone');
            }
        });
    }
};
