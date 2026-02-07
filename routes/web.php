<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('athletes', function () {
        return Inertia::render('athletes/index');
    })->name('athletes.index');

    Route::get('athletes/{athlete}', function (string $athlete) {
        return Inertia::render('athletes/show', [
            'athleteId' => $athlete,
        ]);
    })->name('athletes.show');

    Route::get('coaches', function () {
        return Inertia::render('coaches/index');
    })->name('coaches.index');

    Route::get('admin', function () {
        return Inertia::render('admin/index');
    })->name('admin.index');

    Route::get('settings/overview', function () {
        return Inertia::render('settings/overview');
    })->name('settings.overview');
});

require __DIR__.'/settings.php';
