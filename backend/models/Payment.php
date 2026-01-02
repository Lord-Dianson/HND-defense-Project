<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'Payment';
    protected $primaryKey = 'paymentID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'paymentID', 'studentID', 'hostelID', 'landlordPhone', 'amount', 
        'status', 'reference', 'paidAt', 'createdAt', 'updatedAt'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'studentID', 'ID');
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class, 'hostelID', 'hostelID');
    }

    public function booking()
    {
        return $this->hasOne(Booking::class, 'paymentID', 'paymentID');
    }
}
