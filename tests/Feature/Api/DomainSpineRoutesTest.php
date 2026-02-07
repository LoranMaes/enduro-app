<?php

use App\Models\User;

it('requires authentication for domain API endpoints', function () {
    $this->getJson('/api/training-plans')->assertUnauthorized();
    $this->getJson('/api/training-weeks')->assertUnauthorized();
    $this->getJson('/api/training-sessions')->assertUnauthorized();
    $this->getJson('/api/activities')->assertUnauthorized();
});

it('returns not implemented for authenticated domain API endpoints', function () {
    $this->actingAs(User::factory()->athlete()->create());

    $this->getJson('/api/training-plans')->assertOk();
    $this->getJson('/api/training-weeks')->assertStatus(501);
    $this->getJson('/api/training-sessions')->assertStatus(501);
    $this->getJson('/api/activities')->assertStatus(501);
});
