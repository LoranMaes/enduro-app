<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityProviders\Strava\StravaWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StravaWebhookEventController extends Controller
{
    public function __construct(
        private readonly StravaWebhookProcessor $webhookProcessor,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        if (! is_array($payload)) {
            return response()->json([
                'message' => 'Invalid webhook payload.',
            ], 422);
        }

        $event = $this->webhookProcessor->process($payload);

        return response()->json([
            'status' => 'accepted',
            'event_status' => $event->status,
        ]);
    }
}
