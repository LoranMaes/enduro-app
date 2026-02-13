<?php

use App\Models\User;
use App\Models\WorkoutLibraryItem;

it('requires authentication for workout library endpoints', function () {
    $this->getJson('/api/workout-library')->assertUnauthorized();
});

it('allows athlete users to create list update and delete workout library items', function () {
    $athlete = User::factory()->athlete()->create();

    $created = $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            'title' => 'Threshold Intervals',
            'sport' => 'run',
            'structure_json' => [
                'unit' => 'rpe',
                'mode' => 'target',
                'steps' => [
                    [
                        'id' => 's-1',
                        'type' => 'active',
                        'duration_minutes' => 10,
                        'target' => 7,
                    ],
                    [
                        'id' => 's-2',
                        'type' => 'recovery',
                        'duration_minutes' => 5,
                        'target' => 4,
                    ],
                ],
            ],
            'tags' => ['threshold', 'quality'],
        ])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Threshold Intervals')
        ->assertJsonPath('data.sport', 'run');

    $itemId = $created->json('data.id');

    $this
        ->actingAs($athlete)
        ->getJson('/api/workout-library')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $itemId);

    $this
        ->actingAs($athlete)
        ->patchJson("/api/workout-library/{$itemId}", [
            'title' => 'Updated Threshold Set',
            'structure_json' => [
                'unit' => 'rpe',
                'mode' => 'target',
                'steps' => [
                    [
                        'id' => 's-1',
                        'type' => 'active',
                        'duration_minutes' => 15,
                        'target' => 8,
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Updated Threshold Set')
        ->assertJsonPath('data.estimated_duration_minutes', 15);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/workout-library/{$itemId}")
        ->assertNoContent();

    expect(WorkoutLibraryItem::query()->whereKey($itemId)->exists())->toBeFalse();
});

it('enforces workout library ownership restrictions', function () {
    $owner = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();
    $admin = User::factory()->admin()->create();

    $item = WorkoutLibraryItem::factory()->for($owner)->create();

    $this
        ->actingAs($otherAthlete)
        ->patchJson("/api/workout-library/{$item->id}", [
            'title' => 'Should not update',
        ])
        ->assertForbidden();

    $this
        ->actingAs($otherAthlete)
        ->deleteJson("/api/workout-library/{$item->id}")
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->getJson('/api/workout-library')
        ->assertForbidden();
});
test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
