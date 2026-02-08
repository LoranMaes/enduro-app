<?php

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

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('athletes', function () {
        return Inertia::render('athletes/index');
    })->name('athletes.index');

    Route::get('athletes/{athlete}', AthleteCalendarController::class)
        ->name('athletes.show');

    Route::get('coaches', CoachAthleteIndexController::class)
        ->name('coaches.index');

    Route::get('admin', function () {
        return Inertia::render('admin/index');
    })->name('admin.index');

    Route::get('settings/overview', function () {
        return Inertia::render('settings/overview');
    })->name('settings.overview');
});

require __DIR__.'/settings.php';
