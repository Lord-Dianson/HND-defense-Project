<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    // DB uses plural 'Users' in migrations/seeds
    protected $table = 'Users';
    protected $primaryKey = 'ID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'ID', 'name', 'email', 'password', 'role', 'phone', 'profile', 'accountBalance', 'token', 'status',
        // include common timestamp name variants controllers may use
        'createdAt', 'updatedAt', 'created_at', 'updated_at'
    ];

    protected $hidden = ['password'];

    public function hostels()
    {
        return $this->hasMany(Hostel::class, 'agentID', 'ID');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'studentID', 'ID');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'studentID', 'ID');
    }
}
