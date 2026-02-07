<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrainingSessionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement training session listing with policy-aware query scoping.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@index.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @todo Implement training session creation workflow and validation.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@store.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training session retrieval.
     */
    public function show(TrainingSession $trainingSession): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@show.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Update the specified resource in storage.
     *
     * @todo Implement training session update workflow and validation.
     */
    public function update(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@update.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement training session deletion workflow.
     */
    public function destroy(TrainingSession $trainingSession): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@destroy.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }
}
