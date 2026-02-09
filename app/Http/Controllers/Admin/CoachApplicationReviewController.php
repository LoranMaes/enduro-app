<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewCoachApplicationRequest;
use App\Models\CoachApplication;
use App\Models\CoachProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class CoachApplicationReviewController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        ReviewCoachApplicationRequest $request,
        CoachApplication $coachApplication,
    ): RedirectResponse {
        $admin = $request->user();
        abort_unless($admin !== null, 403);

        $validated = $request->validated();
        $decision = (string) $validated['decision'];
        $isApproved = $decision === 'approve';

        DB::transaction(function () use ($admin, $coachApplication, $isApproved, $validated): void {
            $coachApplication->fill([
                'status' => $isApproved ? 'approved' : 'rejected',
                'review_notes' => $validated['review_notes'] ?? null,
                'reviewed_at' => now(),
                'reviewed_by_user_id' => $admin->id,
            ])->save();

            CoachProfile::query()->updateOrCreate(
                [
                    'user_id' => $coachApplication->user_id,
                ],
                [
                    'is_approved' => $isApproved,
                ],
            );
        });

        return redirect()
            ->route('admin.coach-applications.index')
            ->with(
                'status',
                $isApproved
                    ? 'Coach application approved.'
                    : 'Coach application rejected.',
            );
    }
}
