<?php

use App\Models\User;

it('requires authentication for domain API endpoints', function () {
    $this->getJson('/api/training-plans')->assertUnauthorized();
    $this->getJson('/api/training-weeks')->assertUnauthorized();
    $this->getJson('/api/training-sessions')->assertUnauthorized();
    $this->getJson('/api/activities')->assertUnauthorized();
});

it('returns successful responses for authenticated domain API list endpoints', function () {
    $this->actingAs(User::factory()->athlete()->create());

    $this->getJson('/api/training-plans')->assertOk();
    $this->getJson('/api/training-weeks')->assertOk();
    $this->getJson('/api/training-sessions')->assertOk();
    $this->getJson('/api/activities')->assertOk();
});
