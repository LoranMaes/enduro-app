<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingWeek;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrainingWeekController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement training week listing with policy-aware query scoping.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingWeekController@index.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @todo Implement training week creation workflow and validation.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingWeekController@store.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training week retrieval.
     */
    public function show(TrainingWeek $trainingWeek): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingWeekController@show.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Update the specified resource in storage.
     *
     * @todo Implement training week update workflow and validation.
     */
    public function update(Request $request, TrainingWeek $trainingWeek): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingWeekController@update.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement training week deletion workflow.
     */
    public function destroy(TrainingWeek $trainingWeek): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingWeekController@destroy.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }
}
