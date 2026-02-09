<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachApplication;
use App\Models\CoachApplicationFile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CoachApplicationFileShowController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        Request $request,
        CoachApplication $coachApplication,
        CoachApplicationFile $coachApplicationFile,
    ): StreamedResponse {
        abort_unless(
            $coachApplicationFile->coach_application_id === $coachApplication->id,
            404,
        );

        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $canViewAsAdmin = $user->isAdmin();
        $canViewAsOwner = $user->id === $coachApplication->user_id;
        abort_unless($canViewAsAdmin || $canViewAsOwner, 403);

        $disk = Storage::disk($coachApplicationFile->stored_disk);

        abort_unless($disk->exists($coachApplicationFile->stored_path), 404);

        $filename = $coachApplicationFile->display_name;

        if ($coachApplicationFile->extension !== null) {
            $filename .= '.'.$coachApplicationFile->extension;
        }

        return $disk->response(
            $coachApplicationFile->stored_path,
            $filename,
            [
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ],
        );
    }
}
