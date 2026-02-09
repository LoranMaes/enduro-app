<?php

use App\Models\User;

it('requires authentication for navigation shell pages', function () {
    $this->get('/athletes')->assertRedirect(route('login'));
    $this->get('/coaches')->assertRedirect(route('login'));
    $this->get('/progress')->assertRedirect(route('login'));
    $this->get('/plans')->assertRedirect(route('login'));
    $this->get('/admin')->assertRedirect(route('login'));
    $this->get('/admin/users')->assertRedirect(route('login'));
    $this->get('/admin/coach-applications')->assertRedirect(route('login'));
    $this->get('/coach/pending-approval')->assertRedirect(route('login'));
    $this->get('/settings/overview')->assertRedirect(route('login'));
});

it('applies role-aware navigation shell access for athlete and admin users', function () {
    $athlete = User::factory()->athlete()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($athlete)->get('/athletes')->assertOk();
    $this->actingAs($athlete)->get("/athletes/{$athlete->id}")->assertOk();
    $this->actingAs($athlete)->get('/coaches')->assertOk();
    $this->actingAs($athlete)->get('/progress')->assertOk();
    $this->actingAs($athlete)->get('/plans')->assertOk();
    $this->actingAs($athlete)->get('/settings/overview')->assertOk();
    $this->actingAs($athlete)->get('/admin')->assertForbidden();
    $this->actingAs($athlete)->get('/admin/users')->assertForbidden();
    $this->actingAs($athlete)->get('/admin/coach-applications')->assertForbidden();

    $this->actingAs($admin)->get('/admin')->assertOk();
    $this->actingAs($admin)->get('/admin/users')->assertOk();
    $this->actingAs($admin)->get('/admin/coach-applications')->assertOk();
});
