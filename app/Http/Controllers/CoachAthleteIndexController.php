<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachAthleteIndexController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $assignedAthletes = collect();

        if ($user->isCoach()) {
            $assignedAthletes = $user
                ->coachedAthletes()
                ->select('users.id', 'users.name', 'users.email')
                ->orderBy('users.name')
                ->withCount('trainingPlans')
                ->get();
        }

        if ($user->isAdmin()) {
            $assignedAthletes = User::query()
                ->where('role', 'athlete')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->withCount('trainingPlans')
                ->get();
        }

        return Inertia::render('coaches/index', [
            'assignedAthletes' => $assignedAthletes
                ->map(function (User $athlete): array {
                    return [
                        'id' => $athlete->id,
                        'name' => $athlete->name,
                        'email' => $athlete->email,
                        'training_plans_count' => $athlete->training_plans_count,
                    ];
                })
                ->values(),
        ]);
    }
}
