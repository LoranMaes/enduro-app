<?php

namespace Database\Seeders;

use Database\Seeders\Visual\AdminVisualSeeder;
use Database\Seeders\Visual\AthleteVisualSeeder;
use Database\Seeders\Visual\CoachVisualSeeder;
use Illuminate\Database\Seeder;

class VisualSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            AdminVisualSeeder::class,
            CoachVisualSeeder::class,
            AthleteVisualSeeder::class,
        ]);
    }
}
