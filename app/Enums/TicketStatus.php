<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case ToReview = 'to_review';
    case Done = 'done';
}
