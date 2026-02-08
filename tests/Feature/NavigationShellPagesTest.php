<?php

use App\Models\User;

it('requires authentication for navigation shell pages', function () {
    $this->get('/athletes')->assertRedirect(route('login'));
    $this->get('/coaches')->assertRedirect(route('login'));
    $this->get('/admin')->assertRedirect(route('login'));
    $this->get('/settings/overview')->assertRedirect(route('login'));
});

it('renders navigation shell pages for authenticated users', function () {
    $user = User::factory()->athlete()->create();

    $this->actingAs($user)->get('/athletes')->assertOk();
    $this->actingAs($user)->get("/athletes/{$user->id}")->assertOk();
    $this->actingAs($user)->get('/coaches')->assertOk();
    $this->actingAs($user)->get('/admin')->assertOk();
    $this->actingAs($user)->get('/settings/overview')->assertOk();
});
