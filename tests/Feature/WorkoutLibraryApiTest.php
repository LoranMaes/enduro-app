<?php

use App\Models\User;
use App\Models\WorkoutLibraryItem;
use App\Services\Entitlements\SubscriptionFeatureMatrixService;

it('requires authentication for workout library endpoints', function () {
    $this->getJson('/api/workout-library')->assertUnauthorized();
});

it('allows athlete users to create list update and delete workout library items', function () {
    $athlete = User::factory()->athlete()->create([
        'email' => 'library-athlete-1@e.co',
        'is_subscribed' => true,
        'stripe_subscription_status' => 'active',
    ]);

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
        ->assertJsonPath('meta.total_count', 1)
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
    $owner = User::factory()->athlete()->create([
        'email' => 'library-owner@e.co',
    ]);
    $otherAthlete = User::factory()->athlete()->create([
        'email' => 'library-other@e.co',
    ]);
    $admin = User::factory()->admin()->create([
        'email' => 'library-admin@e.co',
    ]);

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

it('enforces free athlete workout template limits when workout library is enabled', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'library-free-admin@e.co',
    ]);
    $athlete = User::factory()->athlete()->create([
        'email' => 'library-free-athlete@e.co',
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    app(SubscriptionFeatureMatrixService::class)->updateMany([
        [
            'key' => 'workout.library',
            'athlete_free_enabled' => true,
            'athlete_free_limit' => 1,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
    ], $admin);

    $payload = [
        'title' => 'Base Run',
        'sport' => 'run',
        'structure_json' => [
            'unit' => 'rpe',
            'mode' => 'target',
            'steps' => [
                [
                    'id' => 'step-1',
                    'type' => 'active',
                    'duration_minutes' => 30,
                    'target' => 4,
                ],
            ],
        ],
    ];

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', $payload)
        ->assertCreated();

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            ...$payload,
            'title' => 'Base Run 2',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'workout_library',
        ]);
});

it('allows a free athlete to create templates up to the configured limit', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'a@e.co',
    ]);
    $athlete = User::factory()->athlete()->create([
        'email' => 'b@e.co',
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    app(SubscriptionFeatureMatrixService::class)->updateMany([
        [
            'key' => 'workout.library',
            'athlete_free_enabled' => true,
            'athlete_free_limit' => 3,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
    ], $admin);

    $basePayload = [
        'sport' => 'run',
        'structure_json' => [
            'unit' => 'rpe',
            'mode' => 'target',
            'steps' => [
                [
                    'id' => 'step-1',
                    'type' => 'active',
                    'duration_minutes' => 30,
                    'target' => 4,
                ],
            ],
        ],
    ];

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            ...$basePayload,
            'title' => 'Template 1',
        ])
        ->assertCreated();

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            ...$basePayload,
            'title' => 'Template 2',
        ])
        ->assertCreated();

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            ...$basePayload,
            'title' => 'Template 3',
        ])
        ->assertCreated();

    $this
        ->actingAs($athlete)
        ->postJson('/api/workout-library', [
            ...$basePayload,
            'title' => 'Template 4',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'workout_library',
        ]);
});

it('returns total template count metadata independent of sport filters', function () {
    $athlete = User::factory()->athlete()->create([
        'email' => 'library-athlete-2@e.co',
        'is_subscribed' => true,
        'stripe_subscription_status' => 'active',
    ]);

    WorkoutLibraryItem::factory()->for($athlete)->create([
        'sport' => 'run',
        'title' => 'Run Template',
    ]);
    WorkoutLibraryItem::factory()->for($athlete)->create([
        'sport' => 'bike',
        'title' => 'Bike Template',
    ]);

    $this
        ->actingAs($athlete)
        ->getJson('/api/workout-library?sport=run')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.total_count', 2);
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
