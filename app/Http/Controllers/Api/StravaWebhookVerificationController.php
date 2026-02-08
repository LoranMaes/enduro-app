<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StravaWebhookVerificationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $configuredToken = trim((string) config('services.strava.webhook_verify_token', ''));

        if ($configuredToken === '') {
            return response()->json([
                'message' => 'Strava webhook verify token is not configured.',
            ], 503);
        }

        $hubMode = trim((string) ($request->query('hub.mode') ?? $request->query('hub_mode') ?? ''));
        $hubChallenge = trim((string) ($request->query('hub.challenge') ?? $request->query('hub_challenge') ?? ''));
        $hubVerifyToken = trim((string) ($request->query('hub.verify_token') ?? $request->query('hub_verify_token') ?? ''));

        if ($hubMode !== 'subscribe' || ! hash_equals($configuredToken, $hubVerifyToken)) {
            return response()->json([
                'message' => 'Webhook verification failed.',
            ], 403);
        }

        if ($hubChallenge === '') {
            return response()->json([
                'message' => 'Webhook verification challenge is missing.',
            ], 422);
        }

        return response()->json([
            'hub.challenge' => $hubChallenge,
        ]);
    }
}
