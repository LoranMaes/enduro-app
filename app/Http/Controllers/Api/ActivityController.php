<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActivityController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement activity listing with policy-aware query scoping.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement ActivityController@index.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @todo Implement Garmin activity placeholder creation workflow.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement ActivityController@store.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single activity retrieval.
     */
    public function show(Activity $activity): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement ActivityController@show.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Update the specified resource in storage.
     *
     * @todo Implement Garmin activity placeholder update workflow.
     */
    public function update(Request $request, Activity $activity): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement ActivityController@update.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement activity deletion workflow.
     */
    public function destroy(Activity $activity): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement ActivityController@destroy.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }
}
