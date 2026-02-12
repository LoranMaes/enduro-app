<?php

namespace App\Enums;

enum TrainingSessionCompletionSource: string
{
    case Manual = 'manual';
    case ProviderAuto = 'provider_auto';
}
