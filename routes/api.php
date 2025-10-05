<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LogementController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public accommodation routes
Route::get('/logements', [LogementController::class, 'index']);
Route::get('/logements/filters/options', [LogementController::class, 'filters']);
Route::get('/logements/{id}', [LogementController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Reservation routes
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::put('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

    // Payment routes
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/reservation/{reservationId}', [PaymentController::class, 'show']);
    Route::post('/payments/{paymentId}/refund', [PaymentController::class, 'refund']);
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);

    // Reviews (avis)
    Route::post('/avis', [ReviewController::class, 'store']);
});
