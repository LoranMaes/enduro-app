<?php

namespace App\Policies\Concerns;

trait DetectsImpersonation
{
    protected function isImpersonating(): bool
    {
        $request = request();

        if ($request === null || ! $request->hasSession()) {
            return false;
        }

        return $request->session()->has('impersonation.original_user_id')
            && $request->session()->has('impersonation.impersonated_user_id');
    }
}
