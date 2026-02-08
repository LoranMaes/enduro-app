<?php

use App\Http\Controllers\Admin\AdminConsoleController;
use App\Http\Controllers\Admin\AdminUserIndexController;
use App\Http\Controllers\Admin\ImpersonationStartController;
use App\Http\Controllers\Admin\ImpersonationStopController;
use App\Http\Controllers\AthleteCalendarController;
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
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::post('admin/impersonate/stop', ImpersonationStopController::class)
    ->middleware('auth')
    ->name('admin.impersonate.stop');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('athletes', function () {
        return Inertia::render('athletes/index');
    })->name('athletes.index');

    Route::get('athletes/{athlete}', AthleteCalendarController::class)
        ->name('athletes.show');

    Route::get('coaches', CoachAthleteIndexController::class)
        ->name('coaches.index');

    Route::get('progress', function () {
        return Inertia::render('progress/index');
    })->name('progress.index');

    Route::get('plans', function () {
        return Inertia::render('plans/index');
    })->name('plans.index');

    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function (): void {
        Route::get('/', AdminConsoleController::class)->name('index');
        Route::get('/users', AdminUserIndexController::class)->name('users.index');
        Route::post('/impersonate/{user}', ImpersonationStartController::class)
            ->whereNumber('user')
            ->name('impersonate.start');
    });

    Route::get('settings/overview', function () {
        return Inertia::render('settings/overview');
    })->name('settings.overview');
});

require __DIR__.'/settings.php';
