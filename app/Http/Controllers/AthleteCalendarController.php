<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Models\User;
use App\Services\Calendar\AthleteCalendarPayloadService;
use Inertia\Inertia;
use Inertia\Response;

class AthleteCalendarController extends Controller
{
    public function __construct(
        private readonly AthleteCalendarPayloadService $calendarPayloadService,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(IndexRequest $request, User $athlete): Response
    {
        abort_unless($athlete->isAthlete(), 404);

        $viewer = $request->user();

        if (! $this->canViewAthleteCalendar($viewer, $athlete)) {
            abort(403);
        }

        $validated = $request->validated();
        $payload = $this->calendarPayloadService->build($viewer, $validated, $athlete);

        return Inertia::render('dashboard', [
            ...$payload,
            'viewingAthlete' => [
                'id' => $athlete->id,
                'name' => $athlete->name,
            ],
        ]);
    }

    private function canViewAthleteCalendar(User $viewer, User $athlete): bool
    {
        if ($viewer->isAdmin()) {
            return true;
        }

        if ($viewer->isAthlete()) {
            return $viewer->is($athlete);
        }

        if ($viewer->isCoach()) {
            return $viewer->coachedAthletes()->whereKey($athlete->id)->exists();
        }

        return false;
    }
}
