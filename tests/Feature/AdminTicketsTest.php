<?php

use App\Jobs\ArchiveDoneTicketsJob;
use App\Models\AdminSetting;
use App\Models\Ticket;
use App\Models\TicketAuditLog;
use App\Models\TicketInternalNote;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('restricts ticket board pages and APIs to admins', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this->actingAs($admin)
        ->get('/admin/tickets')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/tickets/index'));

    $this->actingAs($athlete)
        ->get('/admin/tickets')
        ->assertForbidden();

    $this->actingAs($admin)
        ->getJson('/api/admin/tickets?view=board')
        ->assertOk();

    $this->actingAs($athlete)
        ->getJson('/api/admin/tickets?view=board')
        ->assertForbidden();
});

it('does not expose admin tickets while impersonating', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this->get('/admin/tickets')->assertForbidden();
    $this->getJson('/api/admin/tickets?view=board')->assertForbidden();
});

it('creates ticket mentions and sends admin notifications', function () {
    $creator = User::factory()->admin()->create();
    $mentioned = User::factory()->admin()->create();

    $this->actingAs($creator)
        ->postJson('/api/admin/tickets', [
            'title' => 'Investigate failed sync worker',
            'description' => [
                [
                    'type' => 'rich_text',
                    'text' => 'Need follow-up from infra.',
                ],
            ],
            'type' => 'bug',
            'importance' => 'high',
            'mention_admin_ids' => [$mentioned->id],
        ])
        ->assertCreated();

    $mentioned->refresh();

    expect($mentioned->notifications()->count())->toBe(1);
    expect($mentioned->unreadNotifications()->count())->toBe(1);
    expect($mentioned->notifications()->first()?->data['ticket_title'] ?? null)
        ->toBe('Investigate failed sync worker');
});

it('searches internal notes only for the current admin', function () {
    $adminA = User::factory()->admin()->create();
    $adminB = User::factory()->admin()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Data ingestion incident',
        'description' => [['type' => 'rich_text', 'text' => 'Public description']],
        'status' => 'todo',
        'type' => 'bug',
        'importance' => 'normal',
        'creator_admin_id' => $adminA->id,
        'assignee_admin_id' => $adminA->id,
    ]);

    TicketInternalNote::query()->create([
        'ticket_id' => $ticket->id,
        'admin_id' => $adminA->id,
        'content' => 'secret-ops-keyword',
    ]);

    $this->actingAs($adminA)
        ->getJson('/api/admin/tickets?view=board&search=secret-ops-keyword')
        ->assertOk()
        ->assertJsonPath('data.todo.0.id', $ticket->id);

    $this->actingAs($adminB)
        ->getJson('/api/admin/tickets?view=board&search=secret-ops-keyword')
        ->assertOk()
        ->assertJsonCount(0, 'data.todo')
        ->assertJsonCount(0, 'data.in_progress')
        ->assertJsonCount(0, 'data.to_review')
        ->assertJsonCount(0, 'data.done');
});

it('archives done tickets after configured delay and logs audit entries', function () {
    AdminSetting::query()->create([
        'scope' => 'tickets',
        'ticket_archive_delay_hours' => 1,
    ]);

    $admin = User::factory()->admin()->create();

    $ticket = Ticket::query()->create([
        'title' => 'Archive this ticket',
        'description' => [['type' => 'rich_text', 'text' => 'Archive flow']],
        'status' => 'done',
        'type' => 'chore',
        'importance' => 'normal',
        'creator_admin_id' => $admin->id,
        'assignee_admin_id' => $admin->id,
        'done_at' => now()->subHours(3),
    ]);

    (new ArchiveDoneTicketsJob)->handle(
        app(\App\Services\Tickets\TicketArchiveDelayResolver::class),
        app(\App\Services\Tickets\TicketAuditLogger::class),
    );

    $ticket->refresh();

    expect($ticket->archived_at)->not->toBeNull();

    expect(TicketAuditLog::query()
        ->where('ticket_id', $ticket->id)
        ->where('event_type', 'ticket_archived')
        ->exists())->toBeTrue();
});

it('allows admins to upload and view ticket attachments', function () {
    Storage::fake((string) config('tickets.attachments.disk', 'local'));

    $admin = User::factory()->admin()->create();
    $ticket = Ticket::query()->create([
        'title' => 'Attachment review',
        'description' => [['type' => 'rich_text', 'text' => 'Attachment required']],
        'status' => 'todo',
        'type' => 'support',
        'importance' => 'low',
        'creator_admin_id' => $admin->id,
        'assignee_admin_id' => $admin->id,
    ]);

    $uploadResponse = $this->actingAs($admin)
        ->post(
            "/api/admin/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('ops-note.txt', 10, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertCreated();

    $downloadUrl = (string) $uploadResponse->json('download_url');

    $this->actingAs($admin)
        ->get($downloadUrl)
        ->assertOk();

    $athlete = User::factory()->athlete()->create();

    $this->actingAs($athlete)
        ->post(
            "/api/admin/tickets/{$ticket->id}/attachments",
            [
                'file' => UploadedFile::fake()->create('unauthorized.txt', 1, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ],
        )
        ->assertForbidden();
});
