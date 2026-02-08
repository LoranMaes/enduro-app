<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('requires authentication for impersonation routes', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('login'));

    $this
        ->post('/admin/impersonate/stop')
        ->assertRedirect(route('login'));
});

it('forbids non-admin users from starting impersonation', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($coach)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertForbidden();

    expect(session('impersonation.original_user_id'))->toBeNull();
    expect(session('impersonation.impersonated_user_id'))->toBeNull();
});

it('allows admins to impersonate athletes and shares impersonation context', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($athlete);
    expect(session('impersonation.original_user_id'))->toBe($admin->id);
    expect(session('impersonation.impersonated_user_id'))->toBe($athlete->id);

    $this
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('auth.user.id', $athlete->id)
            ->where('auth.user.role', 'athlete')
            ->where('auth.impersonating', true)
            ->where('auth.original_user.id', $admin->id)
            ->where('auth.original_user.role', 'admin')
            ->where('auth.impersonated_user.id', $athlete->id)
            ->where('auth.impersonated_user.role', 'athlete')
        );
});

it('allows admins to impersonate coaches with coach-scoped read access', function () {
    $admin = User::factory()->admin()->create();
    $coach = User::factory()->coach()->create();
    $assignedAthlete = User::factory()->athlete()->create();
    $unassignedAthlete = User::factory()->athlete()->create();

    $coach->coachedAthletes()->attach($assignedAthlete->id);

    $assignedPlan = TrainingPlan::factory()->for($assignedAthlete)->create();
    TrainingPlan::factory()->for($unassignedAthlete)->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$coach->id}")
        ->assertRedirect(route('coaches.index'));

    $this->assertAuthenticatedAs($coach);
    expect(session('impersonation.original_user_id'))->toBe($admin->id);
    expect(session('impersonation.impersonated_user_id'))->toBe($coach->id);

    $this
        ->get('/coaches')
        ->assertOk();

    $this
        ->getJson('/api/training-plans')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $assignedPlan->id);
});

it('prevents nested impersonation attempts', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athleteOne->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->post("/admin/impersonate/{$athleteTwo->id}")
        ->assertForbidden();
});

it('rejects attempts to impersonate another admin', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$otherAdmin->id}")
        ->assertUnprocessable();
});

it('blocks impersonated admin sessions from writing training data', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create([
        'starts_at' => '2026-06-01',
        'ends_at' => '2026-06-30',
    ]);
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-06-01',
        'ends_at' => '2026-06-07',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-06-02',
    ]);

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->postJson('/api/training-plans', [
            'user_id' => $athlete->id,
            'title' => 'Blocked During Impersonation',
            'description' => null,
            'starts_at' => '2026-07-01',
            'ends_at' => '2026-07-31',
        ])
        ->assertForbidden();

    $this
        ->putJson("/api/training-weeks/{$week->id}", [
            'starts_at' => '2026-06-01',
            'ends_at' => '2026-06-07',
        ])
        ->assertForbidden();

    $this
        ->deleteJson("/api/training-sessions/{$session->id}")
        ->assertForbidden();
});

it('stops impersonation and restores the original admin context', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->post('/admin/impersonate/stop')
        ->assertRedirect(route('admin.index'));

    $this->assertAuthenticatedAs($admin);
    expect(session('impersonation.original_user_id'))->toBeNull();
    expect(session('impersonation.impersonated_user_id'))->toBeNull();

    $this
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/index')
            ->where('auth.user.id', $admin->id)
            ->where('auth.user.role', 'admin')
            ->where('auth.impersonating', false)
        );
});

it('forbids non-impersonated sessions from stopping impersonation', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->post('/admin/impersonate/stop')
        ->assertForbidden();
});

it('restricts admin pages to admins', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this->actingAs($athlete)->get('/admin')->assertForbidden();
    $this->actingAs($athlete)->get('/admin/users')->assertForbidden();

    $this
        ->actingAs($admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/index'));

    $this
        ->actingAs($admin)
        ->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/users/index'));
});
