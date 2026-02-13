<?php

use App\Models\User;

it('renders the atp page for athlete users', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/atp/2026')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('atp/index')
            ->where('year', 2026)
            ->has('plan.weeks')
            ->has('weekTypeOptions')
            ->has('priorityOptions')
        );
});

it('forbids non athlete access to atp page', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->get('/atp/2026')
        ->assertForbidden();
});
