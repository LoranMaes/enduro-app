<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('allows admins to open analytics and blocks non-admins', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->get('/admin/analytics')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/analytics')
            ->where('range.selected', '12w')
            ->where('range.options', ['4w', '8w', '12w', '24w'])
            ->has('userGrowth')
            ->has('platformUsage')
            ->has('syncHealth')
            ->has('moderation')
            ->has('systemOps'));

    $this
        ->actingAs($athlete)
        ->get('/admin/analytics')
        ->assertForbidden();
});

it('counts athlete and coach roles in analytics growth series', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->athlete()->create();
    User::factory()->coach()->create();

    $this
        ->actingAs($admin)
        ->get('/admin/analytics?range=4w')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/analytics')
            ->where('userGrowth.current.athletes', 1)
            ->where('userGrowth.current.coaches', 1)
            ->where('userGrowth.current.total', 3));
});

it('supports users index filtering and sorting with created-at metadata', function () {
    $admin = User::factory()->admin()->create();
    $targetAthlete = User::factory()->athlete()->create([
        'first_name' => 'Filter',
        'last_name' => 'Target',
        'name' => 'Filter Target',
        'email' => 'filter-target@example.com',
    ]);

    User::factory()->coach()->create([
        'first_name' => 'Coach',
        'last_name' => 'Noise',
        'name' => 'Coach Noise',
    ]);

    $this
        ->actingAs($admin)
        ->get('/admin/users?search=Filter&role=athlete&status=active&sort=created_at&direction=desc')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('filters.search', 'Filter')
            ->where('filters.role', 'athlete')
            ->where('filters.status', 'active')
            ->where('filters.sort', 'created_at')
            ->where('filters.direction', 'desc')
            ->where('users.meta.total', 1)
            ->where('users.data.0.id', $targetAthlete->id)
            ->where('users.data.0.created_at', $targetAthlete->created_at?->toIso8601String()));
});

it('allows admins to suspend and unsuspend non-admin users', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/users/{$athlete->id}/suspend", [
            'reason' => 'Repeated policy violations during training data imports.',
        ])
        ->assertRedirect("/admin/users/{$athlete->id}");

    $athlete->refresh();

    expect($athlete->suspended_at)->not->toBeNull();
    expect($athlete->suspended_by_user_id)->toBe($admin->id);
    expect($athlete->suspension_reason)->toContain('policy violations');

    $this
        ->actingAs($athlete)
        ->get('/dashboard')
        ->assertRedirect(route('login'));

    $this
        ->actingAs($admin)
        ->delete("/admin/users/{$athlete->id}/suspend")
        ->assertRedirect("/admin/users/{$athlete->id}");

    $athlete->refresh();

    expect($athlete->suspended_at)->toBeNull();
    expect($athlete->suspended_by_user_id)->toBeNull();
    expect($athlete->suspension_reason)->toBeNull();
});

it('forbids non-admin users from suspension endpoints', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->post("/admin/users/{$otherAthlete->id}/suspend", [
            'reason' => 'Unauthorized moderation attempt should be blocked.',
        ])
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->delete("/admin/users/{$otherAthlete->id}/suspend")
        ->assertForbidden();
});

it('rejects invalid suspension targets', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/users/{$admin->id}/suspend", [
            'reason' => 'Cannot suspend self account for any reason.',
        ])
        ->assertUnprocessable();

    $this
        ->actingAs($admin)
        ->post("/admin/users/{$otherAdmin->id}/suspend", [
            'reason' => 'Admin moderation should be handled outside this tool.',
        ])
        ->assertUnprocessable();

    expect($admin->fresh()?->suspended_at)->toBeNull();
    expect($otherAdmin->fresh()?->suspended_at)->toBeNull();
});
