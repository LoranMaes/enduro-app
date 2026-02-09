<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\ActivityProviderSyncController;
use App\Http\Controllers\Api\ActivityStreamController;
use App\Http\Controllers\Api\StravaWebhookEventController;
use App\Http\Controllers\Api\StravaWebhookVerificationController;
use App\Http\Controllers\Api\TrainingPlanController;
use App\Http\Controllers\Api\TrainingSessionController;
use App\Http\Controllers\Api\TrainingWeekController;
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
    Route::get('activities/{activity}/streams', ActivityStreamController::class)
        ->name('activities.streams');
    Route::post('activity-providers/{provider}/sync', ActivityProviderSyncController::class)
        ->name('activity-providers.sync');
});
