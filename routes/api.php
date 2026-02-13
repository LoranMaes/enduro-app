<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\ActivityProviderSyncController;
use App\Http\Controllers\Api\ActivityStreamController;
use App\Http\Controllers\Api\Admin\EntryTypeEntitlementController;
use App\Http\Controllers\Api\Admin\TicketAttachmentController;
use App\Http\Controllers\Api\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Api\Admin\TicketInternalNoteController;
use App\Http\Controllers\Api\Admin\TicketNotificationController;
use App\Http\Controllers\Api\Admin\TicketStatusController;
use App\Http\Controllers\Api\Admin\TicketUserSearchController;
use App\Http\Controllers\Api\AtpController;
use App\Http\Controllers\Api\AtpWeekController;
use App\Http\Controllers\Api\CalendarEntryController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\ProgressComplianceController;
use App\Http\Controllers\Api\StravaWebhookEventController;
use App\Http\Controllers\Api\StravaWebhookVerificationController;
use App\Http\Controllers\Api\TrainingPlanController;
use App\Http\Controllers\Api\TrainingSessionController;
use App\Http\Controllers\Api\TrainingWeekController;
use App\Http\Controllers\Api\WorkoutLibraryController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

Route::prefix('webhooks/strava')->name('webhooks.strava.')->group(function (): void {
    Route::get('/', StravaWebhookVerificationController::class)->name('verify');
    Route::post('/', StravaWebhookEventController::class)->name('event');
});

Route::middleware([
    EncryptCookies::class,
    AddQueuedCookiesToResponse::class,
    StartSession::class,
    'auth',
    'not_suspended',
    'approved_coach',
    'log_activity',
])->group(function (): void {
    Route::apiResource('training-plans', TrainingPlanController::class);
    Route::apiResource('training-weeks', TrainingWeekController::class);
    Route::apiResource('training-sessions', TrainingSessionController::class);
    Route::post(
        'training-sessions/{training_session}/link-activity',
        [TrainingSessionController::class, 'linkActivity'],
    )->name('training-sessions.link-activity');
    Route::delete(
        'training-sessions/{training_session}/unlink-activity',
        [TrainingSessionController::class, 'unlinkActivity'],
    )->name('training-sessions.unlink-activity');
    Route::post(
        'training-sessions/{training_session}/complete',
        [TrainingSessionController::class, 'complete'],
    )->name('training-sessions.complete');
    Route::post(
        'training-sessions/{training_session}/revert-completion',
        [TrainingSessionController::class, 'revertCompletion'],
    )->name('training-sessions.revert-completion');
    Route::apiResource('activities', ActivityController::class)->only([
        'index',
        'show',
    ]);
    Route::apiResource('calendar-entries', CalendarEntryController::class)
        ->only([
            'index',
            'store',
            'show',
            'update',
            'destroy',
        ]);
    Route::apiResource('workout-library', WorkoutLibraryController::class)
        ->only([
            'index',
            'store',
            'update',
            'destroy',
        ]);
    Route::apiResource('goals', GoalController::class)
        ->only([
            'index',
            'store',
            'show',
            'update',
        ]);
    Route::get('progress/compliance', ProgressComplianceController::class)
        ->name('progress.compliance');
    Route::get('atp/{year}', AtpController::class)
        ->whereNumber('year')
        ->name('api.atp.show');
    Route::patch('atp/{year}/weeks/{week_start}', AtpWeekController::class)
        ->whereNumber('year')
        ->where('week_start', '\d{4}-\d{2}-\d{2}')
        ->name('api.atp.weeks.update');
    Route::get('activities/{activity}/streams', ActivityStreamController::class)
        ->name('activities.streams');
    Route::post('activity-providers/{provider}/sync', ActivityProviderSyncController::class)
        ->name('activity-providers.sync');

    Route::middleware(['admin', 'not_impersonating'])->prefix('admin')->name('admin.api.')->group(function (): void {
        Route::get('entitlements/entry-types', [EntryTypeEntitlementController::class, 'index'])
            ->name('entitlements.entry-types.index');
        Route::patch('entitlements/entry-types', [EntryTypeEntitlementController::class, 'update'])
            ->name('entitlements.entry-types.update');
        Route::post('entitlements/entry-types/reset', [EntryTypeEntitlementController::class, 'reset'])
            ->name('entitlements.entry-types.reset');
        Route::get('tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
        Route::post('tickets', [AdminTicketController::class, 'store'])->name('tickets.store');
        Route::get('tickets/{ticket}', [AdminTicketController::class, 'show'])->name('tickets.show');
        Route::patch('tickets/{ticket}', [AdminTicketController::class, 'update'])->name('tickets.update');
        Route::delete('tickets/{ticket}', [AdminTicketController::class, 'destroy'])->name('tickets.destroy');
        Route::get('tickets/{ticket}/audit-logs', [AdminTicketController::class, 'auditLogs'])->name('tickets.audit-logs');
        Route::post('tickets/{ticket}/move-status', TicketStatusController::class)->name('tickets.move-status');
        Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store'])->name('tickets.attachments.store');
        Route::get('tickets/{ticket}/attachments/{ticketAttachment}', [TicketAttachmentController::class, 'show'])->name('tickets.attachments.show');
        Route::delete('tickets/{ticket}/attachments/{ticketAttachment}', [TicketAttachmentController::class, 'destroy'])->name('tickets.attachments.destroy');
        Route::put('tickets/{ticket}/internal-note', [TicketInternalNoteController::class, 'upsert'])->name('tickets.internal-note.upsert');
        Route::delete('tickets/{ticket}/internal-note', [TicketInternalNoteController::class, 'destroy'])->name('tickets.internal-note.destroy');
        Route::get('ticket-notifications', [TicketNotificationController::class, 'index'])->name('ticket-notifications.index');
        Route::patch('ticket-notifications/mark-all-seen', [TicketNotificationController::class, 'markAllSeen'])->name('ticket-notifications.mark-all-seen');
        Route::patch('ticket-notifications/{notification}/mark-seen', [TicketNotificationController::class, 'markSeen'])->name('ticket-notifications.mark-seen');
        Route::get('ticket-user-search', TicketUserSearchController::class)->name('ticket-user-search');
    });
});
