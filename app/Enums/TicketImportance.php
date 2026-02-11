<?php

namespace App\Enums;

enum TicketImportance: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';
}
