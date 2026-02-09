<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAthleteProfileSettingsRequest;
use Illuminate\Http\RedirectResponse;

class AthleteProfileSettingsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        UpdateAthleteProfileSettingsRequest $request,
    ): RedirectResponse {
        $user = $request->user();
        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'timezone' => $validated['timezone'],
            'unit_system' => $validated['unit_system'],
        ]);
        $nameParts = preg_split('/\s+/', trim((string) $validated['name'])) ?: [];
        $user->first_name = $nameParts[0] ?? null;
        $user->last_name = count($nameParts) > 1
            ? implode(' ', array_slice($nameParts, 1))
            : null;

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('settings.overview', [
            'tab' => 'profile',
        ])->with('settings_status', 'profile_saved');
    }
}
