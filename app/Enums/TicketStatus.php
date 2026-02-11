<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case ToReview = 'to_review';
    case Done = 'done';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
