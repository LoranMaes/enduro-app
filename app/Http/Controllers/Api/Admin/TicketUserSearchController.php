<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketUserSearchController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'q' => ['required', 'string', 'max:120'],
        ]);

        $search = trim((string) $validated['q']);

        $results = User::query()
            ->select(['id', 'name', 'first_name', 'last_name', 'email', 'role'])
            ->where(function ($query): void {
                $query->whereNull('role')
                    ->orWhereIn('role', ['athlete', 'coach']);
            })
            ->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->limit(3)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->fullName(),
                'email' => $user->email,
                'role' => $user->role?->value ?? 'athlete',
            ])
            ->values()
            ->all();

        return response()->json([
            'data' => $results,
        ]);
    }
}
