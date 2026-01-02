<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class Hostel extends Model
{
    protected $table = 'Hostel';
    protected $primaryKey = 'hostelID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'hostelID', 'name', 'location', 'image', 'capacity', 'roomsLeft',
        'price', 'facilities', 'roomType', 'description', 'status', 
        'agentID', 'landlordPhone', 'verified', 'createdAt', 'updatedAt'
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agentID', 'ID');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'hostelID', 'hostelID');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'hostelID', 'hostelID');
    }
}
