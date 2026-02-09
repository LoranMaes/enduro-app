<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachPendingApprovalController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isCoach(), 403);

        $user->loadMissing([
            'coachProfile',
            'coachApplication.files',
        ]);

        if ($user->coachProfile?->is_approved === true) {
            return redirect()->route('dashboard');
        }

        $application = $user->coachApplication;

        return Inertia::render('auth/pending-approval', [
            'submittedAt' => $application?->submitted_at?->toIso8601String(),
            'application' => $application === null ? null : [
                'status' => $application->status,
                'coaching_experience' => $application->coaching_experience,
                'specialties' => $application->specialties,
                'certifications_summary' => $application->certifications_summary,
                'website_url' => $application->website_url,
                'motivation' => $application->motivation,
                'review_notes' => $application->review_notes,
                'files' => $application->files->map(
                    fn ($file): array => [
                        'id' => $file->id,
                        'display_name' => $file->display_name,
                        'extension' => $file->extension,
                        'mime_type' => $file->mime_type,
                        'size_bytes' => $file->size_bytes,
                        'preview_url' => route(
                            'coach.applications.files.show',
                            [
                                'coachApplication' => $application->id,
                                'coachApplicationFile' => $file->id,
                            ],
                        ),
                    ],
                )->values(),
            ],
        ]);
    }
}
