<?php

namespace App\Http\Requests\Api;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LinkActivityToSessionRequest extends FormRequest
{
    private ?Activity $activity = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'activity_id' => [
                'required',
                'integer',
                Rule::exists('activities', 'id')->whereNull('deleted_at'),
            ],
        ];
    }

    public function activity(): ?Activity
    {
        if ($this->activity instanceof Activity) {
            return $this->activity;
        }

        $activityId = $this->validated('activity_id');

        if (! is_int($activityId) && ! is_string($activityId)) {
            return null;
        }

        $this->activity = Activity::query()->find((int) $activityId);

        return $this->activity;
    }
}
