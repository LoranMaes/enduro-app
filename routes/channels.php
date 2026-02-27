<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.tickets', function ($user) {
    $request = request();
    $isImpersonating = $request !== null
        && $request->hasSession()
        && $request->session()->has('impersonation.original_user_id')
        && $request->session()->has('impersonation.impersonated_user_id');

    return $user->isAdmin() && ! $isImpersonating;
});
