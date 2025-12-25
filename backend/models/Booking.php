<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table = 'Booking';
    protected $primaryKey = 'bookingID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'bookingID', 'studentID', 'hostelID', 'landlordID', 'paymentID', 'agentID', 'checkIn', 'checkOut', 'receipt', 'createdAt', 'updatedAt'
    ];
}
