<?php

namespace App\Enums;

enum TrainingSessionStatus: string
{
    case Planned = 'planned';
    case Completed = 'completed';
    case Skipped = 'skipped';
    case Partial = 'partial';
}
