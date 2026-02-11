<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Models\TrainingPlan;
use App\Services\Calendar\AthleteCalendarPayloadService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AthleteCalendarPayloadService $calendarPayloadService,
    ) {}

    /**
     * Display the dashboard.
     */
    public function __invoke(IndexRequest $request): Response|RedirectResponse
    {
        if ($request->user()->isAdmin()) {
            return redirect()->route('admin.index');
        }

        $this->authorize('viewAny', TrainingPlan::class);

        return Inertia::render('dashboard', $this->calendarPayloadService->build(
            $request->user(),
            $request->validated(),
        ));
    }
}
