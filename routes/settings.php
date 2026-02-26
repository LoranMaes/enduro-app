<?php

use App\Http\Controllers\Settings\ActivityProviderCallbackController;
use App\Http\Controllers\Settings\ActivityProviderConnectController;
use App\Http\Controllers\Settings\ActivityProviderConnectionIndexController;
use App\Http\Controllers\Settings\ActivityProviderDisconnectController;
use App\Http\Controllers\Settings\AthleteProfileSettingsController;
use App\Http\Controllers\Settings\AthleteSettingsOverviewController;
use App\Http\Controllers\Settings\AthleteTrainingPreferencesController;
use App\Http\Controllers\Settings\BillingCheckoutController;
use App\Http\Controllers\Settings\BillingPortalController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'log_activity'])->group(function () {
    Route::redirect('settings', '/settings/overview');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified', 'approved_coach', 'log_activity'])->group(function () {
    Route::get('settings/overview', AthleteSettingsOverviewController::class)
        ->name('settings.overview');
    Route::patch('settings/overview/profile', AthleteProfileSettingsController::class)
        ->name('settings.overview.profile.update');
    Route::patch('settings/overview/training-preferences', AthleteTrainingPreferencesController::class)
        ->name('settings.overview.training-preferences.update');
    Route::get('settings/overview/billing/subscribe', BillingCheckoutController::class)
        ->name('settings.overview.billing.subscribe');
    Route::get('settings/overview/billing/portal', BillingPortalController::class)
        ->name('settings.overview.billing.portal');

    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::redirect('settings/appearance', '/settings/overview?tab=theme')
        ->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/connections', ActivityProviderConnectionIndexController::class)
        ->name('settings.connections');
    Route::get('settings/connections/{provider}/connect', ActivityProviderConnectController::class)
        ->name('settings.connections.connect');
    Route::get('settings/connections/{provider}/callback', ActivityProviderCallbackController::class)
        ->name('settings.connections.callback');
    Route::delete('settings/connections/{provider}', ActivityProviderDisconnectController::class)
        ->name('settings.connections.disconnect');
});
