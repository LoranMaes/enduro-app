<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminNotificationResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class TicketNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);

        $notifications = $admin->notifications()
            ->latest('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => AdminNotificationResource::collection($notifications->getCollection())->resolve(),
            'links' => $notifications->linkCollection()->all(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'from' => $notifications->firstItem(),
                'last_page' => $notifications->lastPage(),
                'path' => $notifications->path(),
                'per_page' => $notifications->perPage(),
                'to' => $notifications->lastItem(),
                'total' => $notifications->total(),
                'unread_count' => $admin->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markSeen(Request $request, string $notification): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $record = $admin->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        if ($record instanceof DatabaseNotification && $record->read_at === null) {
            $record->markAsRead();
        }

        return response()->json([
            'notification' => (new AdminNotificationResource($record))->resolve(),
            'unread_count' => $admin->unreadNotifications()->count(),
        ]);
    }

    public function markAllSeen(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $admin->unreadNotifications->markAsRead();

        return response()->json([
            'unread_count' => 0,
        ]);
    }
}
