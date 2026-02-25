<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_load_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->date('date');
            $table->string('sport')
                ->nullable();
            $table->float('tss')
                ->default(0);
            $table->float('atl')
                ->default(0);
            $table->float('ctl')
                ->default(0);
            $table->float('tsb')
                ->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('date');
            $table->unique(['user_id', 'date', 'sport']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_load_snapshots');
    }
};
