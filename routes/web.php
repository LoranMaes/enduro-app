<?php

use App\Http\Controllers\Admin\AdminConsoleController;
use App\Http\Controllers\Admin\AdminUserIndexController;
use App\Http\Controllers\Admin\AdminUserShowController;
use App\Http\Controllers\Admin\CoachApplicationFileShowController;
use App\Http\Controllers\Admin\CoachApplicationIndexController;
use App\Http\Controllers\Admin\CoachApplicationReviewController;
use App\Http\Controllers\Admin\ImpersonationStartController;
use App\Http\Controllers\Admin\ImpersonationStopController;
use App\Http\Controllers\AthleteActivityDetailController;
use App\Http\Controllers\AthleteCalendarController;
use App\Http\Controllers\AthleteProgressController;
use App\Http\Controllers\AthleteSessionDetailController;
use App\Http\Controllers\Auth\CoachPendingApprovalController;
use App\Http\Controllers\CoachAthleteIndexController;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return Inertia::render('landing', [
        'enterLabUrl' => $request->user() ? route('dashboard') : route('login'),
    ]);
})->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'approved_coach'])
    ->name('dashboard');

Route::get('coach/pending-approval', CoachPendingApprovalController::class)
    ->middleware('auth')
    ->name('coach.pending-approval');

Route::get(
    'coach/applications/{coachApplication}/files/{coachApplicationFile}',
    CoachApplicationFileShowController::class,
)
    ->middleware('auth')
    ->whereNumber('coachApplication')
    ->whereNumber('coachApplicationFile')
    ->name('coach.applications.files.show');

Route::post('admin/impersonate/stop', ImpersonationStopController::class)
    ->middleware(['auth', 'log_activity'])
    ->name('admin.impersonate.stop');

Route::middleware(['auth', 'verified', 'log_activity'])->group(function (): void {
    Route::get('athletes', function () {
        return Inertia::render('athletes/index');
    })->middleware('approved_coach')->name('athletes.index');

    Route::get('athletes/{athlete}', AthleteCalendarController::class)
        ->middleware('approved_coach')
        ->name('athletes.show');

    Route::get('coaches', CoachAthleteIndexController::class)
        ->middleware('approved_coach')
        ->name('coaches.index');

    Route::get('progress', AthleteProgressController::class)
        ->middleware('approved_coach')
        ->name('progress.index');

    Route::get('sessions/{trainingSession}', AthleteSessionDetailController::class)
        ->middleware('approved_coach')
        ->name('sessions.show');
    Route::get('activity-details/{activity}', AthleteActivityDetailController::class)
        ->middleware('approved_coach')
        ->name('activity-details.show');

    Route::get('plans', function () {
        return Inertia::render('plans/index');
    })->middleware('approved_coach')->name('plans.index');

    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function (): void {
        Route::get('/', AdminConsoleController::class)->name('index');
        Route::get('/users', AdminUserIndexController::class)->name('users.index');
        Route::get('/users/{user}', AdminUserShowController::class)
            ->whereNumber('user')
            ->name('users.show');
        Route::get('/coach-applications', CoachApplicationIndexController::class)
            ->name('coach-applications.index');
        Route::post('/coach-applications/{coachApplication}/review', CoachApplicationReviewController::class)
            ->whereNumber('coachApplication')
            ->name('coach-applications.review');
        Route::get('/coach-applications/{coachApplication}/files/{coachApplicationFile}', CoachApplicationFileShowController::class)
            ->whereNumber('coachApplication')
            ->whereNumber('coachApplicationFile')
            ->name('coach-applications.files.show');
        Route::post('/impersonate/{user}', ImpersonationStartController::class)
            ->whereNumber('user')
            ->name('impersonate.start');
    });

});

require __DIR__.'/settings.php';
