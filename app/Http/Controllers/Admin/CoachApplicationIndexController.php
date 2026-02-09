<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachApplicationIndexController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,approved,accepted,rejected,all'],
        ]);

        $activeStatus = strtolower(trim((string) ($validated['status'] ?? 'pending')));

        if ($activeStatus === 'accepted') {
            $activeStatus = 'approved';
        }

        $allApplications = CoachApplication::query()
            ->with([
                'user:id,name,first_name,last_name,email',
                'files',
                'reviewedBy:id,name,first_name,last_name',
            ])
            ->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        $applications = $activeStatus === 'all'
            ? $allApplications
            : $allApplications->where('status', $activeStatus)->values();

        $pendingCount = $allApplications->where('status', 'pending')->count();
        $approvedCount = $allApplications->where('status', 'approved')->count();
        $rejectedCount = $allApplications->where('status', 'rejected')->count();

        return Inertia::render('admin/coach-applications/index', [
            'activeStatus' => $activeStatus,
            'metrics' => [
                'total' => $allApplications->count(),
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
            ],
            'applications' => $applications->map(
                fn (CoachApplication $application): array => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'submitted_at' => $application->submitted_at?->toIso8601String(),
                    'reviewed_at' => $application->reviewed_at?->toIso8601String(),
                    'review_notes' => $application->review_notes,
                    'reviewed_by' => $application->reviewedBy?->fullName(),
                    'user' => [
                        'id' => $application->user?->id,
                        'name' => $application->user?->fullName(),
                        'email' => $application->user?->email,
                    ],
                    'answers' => [
                        'coaching_experience' => $application->coaching_experience,
                        'specialties' => $application->specialties,
                        'certifications_summary' => $application->certifications_summary,
                        'website_url' => $application->website_url,
                        'motivation' => $application->motivation,
                    ],
                    'files' => $application->files->map(
                        fn ($file): array => [
                            'id' => $file->id,
                            'display_name' => $file->display_name,
                            'extension' => $file->extension,
                            'mime_type' => $file->mime_type,
                            'size_bytes' => $file->size_bytes,
                            'preview_url' => route(
                                'admin.coach-applications.files.show',
                                [
                                    'coachApplication' => $application->id,
                                    'coachApplicationFile' => $file->id,
                                ],
                            ),
                        ],
                    )->values(),
                    'review_url' => route(
                        'admin.coach-applications.review',
                        [
                            'coachApplication' => $application->id,
                        ],
                    ),
                ],
            )->values(),
        ]);
    }
}
