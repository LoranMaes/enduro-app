<?php

use App\Models\CoachAthleteAssignment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;

it('enforces unique coach athlete assignments', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    CoachAthleteAssignment::query()->create([
        'coach_id' => $coach->id,
        'athlete_id' => $athlete->id,
    ]);

    expect(function () use ($coach, $athlete): void {
        CoachAthleteAssignment::query()->create([
            'coach_id' => $coach->id,
            'athlete_id' => $athlete->id,
        ]);
    })->toThrow(QueryException::class);
});

it('exposes coach and athlete relationships through user model', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    CoachAthleteAssignment::query()->create([
        'coach_id' => $coach->id,
        'athlete_id' => $athlete->id,
    ]);

    expect($coach->coachedAthletes()->pluck('users.id')->all())
        ->toBe([$athlete->id]);
    expect($athlete->coaches()->pluck('users.id')->all())
        ->toBe([$coach->id]);
});

it('shows only assigned athletes on the coach directory page', function () {
    $coach = User::factory()->coach()->create();
    $assignedAthlete = User::factory()->athlete()->create();
    User::factory()->athlete()->create();

    $coach->coachedAthletes()->attach($assignedAthlete->id);

    $this
        ->actingAs($coach)
        ->get('/coaches')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('coaches/index')
            ->has('assignedAthletes', 1)
            ->where('assignedAthletes.0.id', $assignedAthlete->id)
        );
});
