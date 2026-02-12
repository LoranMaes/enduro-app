<?php

use App\Models\CalendarEntry;
use App\Models\EntryTypeEntitlement;
use App\Models\User;

it('requires authentication for calendar entries endpoints', function () {
    $this->getJson('/api/calendar-entries')->assertUnauthorized();
    $this->postJson('/api/calendar-entries', [
        'date' => '2026-03-01',
        'type' => 'note',
        'title' => 'Check-in',
    ])->assertUnauthorized();
});

it('allows an athlete to manage own calendar entries', function () {
    $athlete = User::factory()->athlete()->create();

    $createResponse = $this
        ->actingAs($athlete)
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-01',
            'type' => 'event',
            'title' => 'Race briefing',
            'body' => 'Arrive 30 min early.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', 'event');

    $entryId = (int) $createResponse->json('data.id');

    $this
        ->actingAs($athlete)
        ->getJson('/api/calendar-entries?from=2026-03-01&to=2026-03-02')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $entryId);

    $this
        ->actingAs($athlete)
        ->putJson("/api/calendar-entries/{$entryId}", [
            'type' => 'note',
            'title' => 'Updated note',
            'body' => 'Easy day.',
        ])
        ->assertOk()
        ->assertJsonPath('data.type', 'note')
        ->assertJsonPath('data.title', 'Updated note');

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/calendar-entries/{$entryId}")
        ->assertNoContent();

    expect(CalendarEntry::query()->withTrashed()->find($entryId)?->trashed())
        ->toBeTrue();
});

it('forbids coach and direct admin access to calendar entry writes', function () {
    $coach = User::factory()->coach()->create();
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($coach)
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-02',
            'type' => 'note',
        ])
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-02',
            'type' => 'note',
        ])
        ->assertForbidden();
});

it('allows calendar entry writes while impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-05',
            'type' => 'goal',
            'title' => 'Long run goal',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $athlete->id);
});

it('blocks gated entry types for non subscribed athletes', function () {
    EntryTypeEntitlement::query()->create([
        'key' => 'other.event',
        'requires_subscription' => true,
    ]);
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-06',
            'type' => 'event',
            'title' => 'Blocked event',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('allows gated entry types for subscribed athletes', function () {
    EntryTypeEntitlement::query()->create([
        'key' => 'other.event',
        'requires_subscription' => true,
    ]);
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => true,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/calendar-entries', [
            'date' => '2026-03-07',
            'type' => 'event',
            'title' => 'Allowed event',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', 'event');
});
