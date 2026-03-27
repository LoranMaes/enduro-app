<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('athlete_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('athlete_profiles', 'lt1_power_watts')) {
                $table->unsignedSmallInteger('lt1_power_watts')
                    ->nullable()
                    ->after('ftp_watts');
            }

            if (! Schema::hasColumn('athlete_profiles', 'lt2_power_watts')) {
                $table->unsignedSmallInteger('lt2_power_watts')
                    ->nullable()
                    ->after('lt1_power_watts');
            }

            if (! Schema::hasColumn('athlete_profiles', 'lt1_heart_rate_bpm')) {
                $table->unsignedSmallInteger('lt1_heart_rate_bpm')
                    ->nullable()
                    ->after('max_heart_rate_bpm');
            }

            if (! Schema::hasColumn('athlete_profiles', 'lt2_heart_rate_bpm')) {
                $table->unsignedSmallInteger('lt2_heart_rate_bpm')
                    ->nullable()
                    ->after('lt1_heart_rate_bpm');
            }
        });
    }
};
