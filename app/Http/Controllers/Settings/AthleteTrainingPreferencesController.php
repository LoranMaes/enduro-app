<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAthleteTrainingPreferencesRequest;
use Illuminate\Http\RedirectResponse;

class AthleteTrainingPreferencesController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        UpdateAthleteTrainingPreferencesRequest $request,
    ): RedirectResponse {
        $user = $request->user();
        $validated = $request->validated();

        $user->athleteProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'primary_sport' => $validated['primary_sport'],
                'weekly_training_days' => $validated['weekly_training_days'],
                'preferred_rest_day' => $validated['preferred_rest_day'],
                'intensity_distribution' => $validated['intensity_distribution'],
                'ftp_watts' => $validated['ftp_watts'] ?? null,
                'max_heart_rate_bpm' => $validated['max_heart_rate_bpm'] ?? null,
                'threshold_heart_rate_bpm' => $validated['threshold_heart_rate_bpm'] ?? null,
                'threshold_pace_minutes_per_km' => $validated['threshold_pace_minutes_per_km'] ?? null,
                'power_zones' => $validated['power_zones'] ?? null,
                'heart_rate_zones' => $validated['heart_rate_zones'] ?? null,
            ],
        );

        return to_route('settings.overview', [
            'tab' => 'training',
        ])->with('settings_status', 'training_preferences_saved');
    }
}
