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
        'bookingID', 'studentID', 'hostelID', 'landlordPhone', 'paymentID', 
        'checkOut', 'receipt', 'createdAt', 'updatedAt'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'ID');
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class, 'hostelID', 'hostelID');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'paymentID', 'paymentID');
    }
}
