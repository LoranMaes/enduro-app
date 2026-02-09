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
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 120)
                    ->nullable()
                    ->after('name');
            }

            if (! Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 120)
                    ->nullable()
                    ->after('first_name');
            }
        });

        DB::table('users')
            ->select('id', 'name')
            ->orderBy('id')
            ->chunkById(100, function ($users): void {
                foreach ($users as $user) {
                    $name = trim((string) $user->name);

                    if ($name === '') {
                        continue;
                    }

                    $parts = preg_split('/\s+/', $name) ?: [];
                    $firstName = array_shift($parts) ?? null;
                    $lastName = count($parts) > 0 ? implode(' ', $parts) : null;

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'last_name')) {
                $table->dropColumn('last_name');
            }

            if (Schema::hasColumn('users', 'first_name')) {
                $table->dropColumn('first_name');
            }
        });
    }
};
