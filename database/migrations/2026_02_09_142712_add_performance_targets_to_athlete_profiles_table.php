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
        Schema::table('athlete_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('athlete_profiles', 'ftp_watts')) {
                $table->unsignedSmallInteger('ftp_watts')
                    ->nullable()
                    ->after('intensity_distribution');
            }

            if (! Schema::hasColumn('athlete_profiles', 'max_heart_rate_bpm')) {
                $table->unsignedSmallInteger('max_heart_rate_bpm')
                    ->nullable()
                    ->after('ftp_watts');
            }

            if (! Schema::hasColumn('athlete_profiles', 'threshold_heart_rate_bpm')) {
                $table->unsignedSmallInteger('threshold_heart_rate_bpm')
                    ->nullable()
                    ->after('max_heart_rate_bpm');
            }

            if (! Schema::hasColumn('athlete_profiles', 'threshold_pace_seconds_per_km')) {
                $table->unsignedSmallInteger('threshold_pace_seconds_per_km')
                    ->nullable()
                    ->after('threshold_heart_rate_bpm');
            }

            if (! Schema::hasColumn('athlete_profiles', 'power_zones')) {
                $table->json('power_zones')
                    ->nullable()
                    ->after('threshold_pace_seconds_per_km');
            }

            if (! Schema::hasColumn('athlete_profiles', 'heart_rate_zones')) {
                $table->json('heart_rate_zones')
                    ->nullable()
                    ->after('power_zones');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athlete_profiles', function (Blueprint $table): void {
            if (Schema::hasColumn('athlete_profiles', 'heart_rate_zones')) {
                $table->dropColumn('heart_rate_zones');
            }

            if (Schema::hasColumn('athlete_profiles', 'power_zones')) {
                $table->dropColumn('power_zones');
            }

            if (Schema::hasColumn('athlete_profiles', 'threshold_pace_seconds_per_km')) {
                $table->dropColumn('threshold_pace_seconds_per_km');
            }

            if (Schema::hasColumn('athlete_profiles', 'threshold_heart_rate_bpm')) {
                $table->dropColumn('threshold_heart_rate_bpm');
            }

            if (Schema::hasColumn('athlete_profiles', 'max_heart_rate_bpm')) {
                $table->dropColumn('max_heart_rate_bpm');
            }

            if (Schema::hasColumn('athlete_profiles', 'ftp_watts')) {
                $table->dropColumn('ftp_watts');
            }
        });
    }
};
