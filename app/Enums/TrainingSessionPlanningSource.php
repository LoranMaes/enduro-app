<?php

namespace App\Enums;

enum TrainingSessionPlanningSource: string
{
    case Planned = 'planned';
    case Unplanned = 'unplanned';
}
