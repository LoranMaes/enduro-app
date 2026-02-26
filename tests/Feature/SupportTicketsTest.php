<?php

use App\Jobs\ArchiveDoneTicketsJob;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
});

it('allows athletes and coaches to access support while blocking admin context', function () {
    $athlete = User::factory()->athlete()->create();
    $coach = User::factory()->coach()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($athlete)
        ->get('/support')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('support/index'));

    $this->actingAs($athlete)
        ->getJson('/api/support/tickets')
        ->assertOk();

    $this->actingAs($coach)
        ->get('/support')
        ->assertOk();

    $this->actingAs($coach)
        ->getJson('/api/support/tickets')
        ->assertOk();

    $this->actingAs($admin)
        ->get('/support')
        ->assertForbidden();

    $this->actingAs($admin)
        ->getJson('/api/support/tickets')
        ->assertForbidden();
});

it('allows support access while impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this->get('/support')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('support/index'));

    $this->getJson('/api/support/tickets')
        ->assertOk();
});

it('creates support tickets with user source and reporter linkage', function () {
    $athlete = User::factory()->athlete()->create();

    $response = $this->actingAs($athlete)
        ->postJson('/api/support/tickets', [
            'title' => 'Workout sync issue',
            'type' => 'bug',
            'message' => 'My synced workout appears twice on the calendar.',
        ])
        ->assertCreated();

    $ticketIdentifier = (string) $response->json('id');
    $ticket = Ticket::query()
        ->whereKey($ticketIdentifier)
        ->orWhere('public_id', $ticketIdentifier)
        ->firstOrFail();

    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'source' => 'user',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
    ]);

    $this->assertDatabaseHas('ticket_messages', [
        'ticket_id' => $ticket->id,
        'author_user_id' => $athlete->id,
    ]);
});

it('enforces ownership on support ticket detail, messages, and attachments', function () {
    Storage::fake((string) config('tickets.attachments.disk', 'local'));

    $owner = User::factory()->athlete()->create();
    $other = User::factory()->athlete()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Owner ticket',
        'description' => [['type' => 'rich_text', 'text' => 'Support thread']],
        'source' => 'user',
        'status' => 'todo',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $owner->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => null,
    ]);

    $this->actingAs($other)
        ->getJson("/api/support/tickets/{$ticket->id}")
        ->assertForbidden();

    $this->actingAs($other)
        ->postJson("/api/support/tickets/{$ticket->id}/messages", [
            'body' => 'Trying to reply to someone else ticket.',
        ])
        ->assertForbidden();

    $this->actingAs($other)
        ->post(
            "/api/support/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('proof.txt', 1, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertForbidden();
});

it('records first admin response timestamp when admin replies to user tickets', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Need follow-up',
        'description' => [['type' => 'rich_text', 'text' => 'Question']],
        'source' => 'user',
        'status' => 'todo',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => $admin->id,
    ]);

    $this->actingAs($athlete)
        ->postJson("/api/support/tickets/{$ticket->id}/messages", [
            'body' => 'Any update on this?',
        ])
        ->assertCreated();

    $this->actingAs($admin)
        ->postJson("/api/admin/tickets/{$ticket->id}/messages", [
            'body' => 'We are working on it.',
        ])
        ->assertCreated();

    $ticket->refresh();

    expect($ticket->first_admin_response_at)->not->toBeNull();

    $this->actingAs($athlete)
        ->getJson("/api/support/tickets/{$ticket->id}")
        ->assertOk()
        ->assertJsonPath('data.has_admin_response', true);
});

it('locks messages and attachments once ticket is done', function () {
    Storage::fake((string) config('tickets.attachments.disk', 'local'));

    $athlete = User::factory()->athlete()->create();
    $admin = User::factory()->admin()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Resolved ticket',
        'description' => [['type' => 'rich_text', 'text' => 'Done thread']],
        'source' => 'user',
        'status' => 'done',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => $admin->id,
        'done_at' => now()->subHour(),
    ]);

    $this->actingAs($athlete)
        ->postJson("/api/support/tickets/{$ticket->id}/messages", [
            'body' => 'Can I still post here?',
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.ticket.0', 'This ticket is resolved and no longer accepts new replies.');

    $this->actingAs($athlete)
        ->post(
            "/api/support/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('done.txt', 1, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertStatus(422)
        ->assertJsonPath('errors.ticket.0', 'This ticket is resolved and no longer accepts new replies.');

    $this->actingAs($admin)
        ->postJson("/api/admin/tickets/{$ticket->id}/messages", [
            'body' => 'Admin reply after done',
        ])
        ->assertStatus(422);
});

it('enforces support attachment size and total file limits', function () {
    Storage::fake((string) config('tickets.attachments.disk', 'local'));

    $athlete = User::factory()->athlete()->create();
    $ticket = Ticket::query()->create([
        'title' => 'Attachment limits',
        'description' => [['type' => 'rich_text', 'text' => 'Limits']],
        'source' => 'user',
        'status' => 'todo',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => null,
    ]);

    $this->actingAs($athlete)
        ->post(
            "/api/support/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('too-large.pdf', 11000, 'application/pdf'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertStatus(422)
        ->assertJsonPath('errors.file.0', 'Files must be 10MB or smaller.');

    foreach (range(1, 5) as $index) {
        TicketAttachment::query()->create([
            'ticket_id' => $ticket->id,
            'uploaded_by_user_id' => $athlete->id,
            'uploaded_by_admin_id' => null,
            'original_name' => "file-{$index}.txt",
            'display_name' => "file-{$index}",
            'extension' => 'txt',
            'mime_type' => 'text/plain',
            'size_bytes' => 100,
            'stored_disk' => 'local',
            'stored_path' => "tickets/{$ticket->id}/file-{$index}.txt",
        ]);
    }

    $this->actingAs($athlete)
        ->post(
            "/api/support/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('overflow.txt', 1, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertStatus(422)
        ->assertJsonPath('errors.file.0', 'You can upload up to 5 files per support ticket.');
});

it('moves done tickets to archived bucket after archive job delay', function () {
    $athlete = User::factory()->athlete()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Archive me',
        'description' => [['type' => 'rich_text', 'text' => 'Archive after delay']],
        'source' => 'user',
        'status' => 'done',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => null,
        'done_at' => now()->subHours(30),
    ]);

    (new ArchiveDoneTicketsJob)->handle(
        app(\App\Services\Tickets\TicketArchiveDelayResolver::class),
        app(\App\Services\Tickets\TicketAuditLogger::class),
    );

    $ticket->refresh();
    expect($ticket->archived_at)->not->toBeNull();

    $response = $this->actingAs($athlete)
        ->getJson('/api/support/tickets')
        ->assertOk();

    $activeIds = collect((array) $response->json('active'))
        ->pluck('id')
        ->map(static fn (mixed $id): string => (string) $id)
        ->all();
    $archivedIds = collect((array) $response->json('archived'))
        ->pluck('id')
        ->map(static fn (mixed $id): string => (string) $id)
        ->all();

    expect($activeIds)->not->toContain((string) $ticket->getRouteKey());
    expect($archivedIds)->toContain((string) $ticket->getRouteKey());
});

it('shows user-origin ticket metadata in admin board payload and supports source filters', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    Ticket::query()->create([
        'title' => 'Internal admin ticket',
        'description' => [['type' => 'rich_text', 'text' => 'Admin scope']],
        'source' => 'admin',
        'status' => 'todo',
        'type' => 'feature',
        'importance' => 'normal',
        'creator_admin_id' => $admin->id,
        'assignee_admin_id' => $admin->id,
    ]);

    $userTicket = Ticket::query()->create([
        'title' => 'User support report',
        'description' => [['type' => 'rich_text', 'text' => 'User scope']],
        'source' => 'user',
        'status' => 'todo',
        'type' => 'support',
        'importance' => 'normal',
        'reporter_user_id' => $athlete->id,
        'creator_admin_id' => null,
        'assignee_admin_id' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/tickets?view=board&source=user')
        ->assertOk();

    $response
        ->assertJsonPath('data.todo.0.id', (string) $userTicket->getRouteKey())
        ->assertJsonPath('data.todo.0.source', 'user')
        ->assertJsonPath('data.todo.0.reporter_user.id', (string) $athlete->getRouteKey());
});
