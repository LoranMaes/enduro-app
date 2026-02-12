<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListCalendarEntryRequest;
use App\Http\Requests\Api\StoreCalendarEntryRequest;
use App\Http\Requests\Api\UpdateCalendarEntryRequest;
use App\Http\Resources\CalendarEntryResource;
use App\Models\CalendarEntry;
use App\Models\User;
use App\Services\Entitlements\EntryTypeEntitlementService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class CalendarEntryController extends Controller
{
    public function __construct(
        private readonly EntryTypeEntitlementService $entryTypeEntitlementService,
    ) {}

    public function index(ListCalendarEntryRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', CalendarEntry::class);

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 100);

        $entries = CalendarEntry::query()
            ->where('user_id', $request->user()->id)
            ->when(
                isset($validated['from']),
                fn (Builder $query) => $query->whereDate('scheduled_date', '>=', $validated['from']),
            )
            ->when(
                isset($validated['to']),
                fn (Builder $query) => $query->whereDate('scheduled_date', '<=', $validated['to']),
            )
            ->when(
                isset($validated['type']),
                fn (Builder $query) => $query->where('type', $validated['type']),
            )
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return CalendarEntryResource::collection($entries);
    }

    public function store(StoreCalendarEntryRequest $request): JsonResponse
    {
        $this->authorize('create', CalendarEntry::class);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $validated = $request->validated();
        $entryTypeKey = sprintf('other.%s', $validated['type']);

        $this->ensureEntitlement($entryTypeKey, $user);

        $entry = CalendarEntry::query()->create([
            'user_id' => $user->id,
            'scheduled_date' => $validated['date'],
            'type' => $validated['type'],
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'] ?? null,
            'meta' => $validated['meta'] ?? null,
        ]);

        return (new CalendarEntryResource($entry))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CalendarEntry $calendarEntry): CalendarEntryResource
    {
        $this->authorize('view', $calendarEntry);

        return new CalendarEntryResource($calendarEntry);
    }

    public function update(
        UpdateCalendarEntryRequest $request,
        CalendarEntry $calendarEntry,
    ): CalendarEntryResource {
        $this->authorize('update', $calendarEntry);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $validated = $request->validated();
        $type = $validated['type'] ?? $calendarEntry->type?->value ?? (string) $calendarEntry->type;
        $entryTypeKey = sprintf('other.%s', $type);
        $this->ensureEntitlement($entryTypeKey, $user);

        $calendarEntry->update([
            'scheduled_date' => $validated['date'] ?? $calendarEntry->scheduled_date,
            'type' => $type,
            'title' => array_key_exists('title', $validated)
                ? $validated['title']
                : $calendarEntry->title,
            'body' => array_key_exists('body', $validated)
                ? $validated['body']
                : $calendarEntry->body,
            'meta' => array_key_exists('meta', $validated)
                ? $validated['meta']
                : $calendarEntry->meta,
        ]);

        return new CalendarEntryResource($calendarEntry->refresh());
    }

    public function destroy(CalendarEntry $calendarEntry): \Illuminate\Http\Response
    {
        $this->authorize('delete', $calendarEntry);
        $calendarEntry->delete();

        return response()->noContent();
    }

    private function ensureEntitlement(string $entryTypeKey, User $user): void
    {
        if ($user->is_subscribed) {
            return;
        }

        if (! $this->entryTypeEntitlementService->requiresSubscription($entryTypeKey)) {
            return;
        }

        throw ValidationException::withMessages([
            'type' => 'This entry type requires an active subscription.',
        ]);
    }
}
