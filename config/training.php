<?php

return [
    'entry_types' => [
        'definitions' => [
            ['key' => 'workout.run', 'category' => 'workout', 'label' => 'Run'],
            ['key' => 'workout.bike', 'category' => 'workout', 'label' => 'Bike'],
            ['key' => 'workout.swim', 'category' => 'workout', 'label' => 'Swim'],
            ['key' => 'workout.day_off', 'category' => 'workout', 'label' => 'Day Off'],
            ['key' => 'workout.mtn_bike', 'category' => 'workout', 'label' => 'MTN Bike'],
            ['key' => 'workout.custom', 'category' => 'workout', 'label' => 'Custom'],
            ['key' => 'workout.walk', 'category' => 'workout', 'label' => 'Walk'],
            ['key' => 'other.event', 'category' => 'other', 'label' => 'Event'],
            ['key' => 'other.goal', 'category' => 'other', 'label' => 'Goal'],
            ['key' => 'other.note', 'category' => 'other', 'label' => 'Note'],
        ],
        'defaults' => [
            'workout.run' => (bool) env('ENTITLEMENT_WORKOUT_RUN_REQUIRES_SUBSCRIPTION', false),
            'workout.bike' => (bool) env('ENTITLEMENT_WORKOUT_BIKE_REQUIRES_SUBSCRIPTION', false),
            'workout.swim' => (bool) env('ENTITLEMENT_WORKOUT_SWIM_REQUIRES_SUBSCRIPTION', false),
            'workout.day_off' => (bool) env('ENTITLEMENT_WORKOUT_DAY_OFF_REQUIRES_SUBSCRIPTION', false),
            'workout.mtn_bike' => (bool) env('ENTITLEMENT_WORKOUT_MTN_BIKE_REQUIRES_SUBSCRIPTION', false),
            'workout.custom' => (bool) env('ENTITLEMENT_WORKOUT_CUSTOM_REQUIRES_SUBSCRIPTION', false),
            'workout.walk' => (bool) env('ENTITLEMENT_WORKOUT_WALK_REQUIRES_SUBSCRIPTION', false),
            'other.event' => (bool) env('ENTITLEMENT_OTHER_EVENT_REQUIRES_SUBSCRIPTION', false),
            'other.goal' => (bool) env('ENTITLEMENT_OTHER_GOAL_REQUIRES_SUBSCRIPTION', false),
            'other.note' => (bool) env('ENTITLEMENT_OTHER_NOTE_REQUIRES_SUBSCRIPTION', false),
        ],
    ],
    'atp' => [
        'week_types' => [
            'base',
            'build',
            'recovery',
            'peak',
            'race',
            'transition',
        ],
        'priorities' => [
            'low',
            'normal',
            'high',
        ],
    ],
];
