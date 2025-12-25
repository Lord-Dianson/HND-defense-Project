<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class Landlord extends Model
{
    protected $table = 'Landlord';
    protected $primaryKey = 'landlordID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'landlordID', 'name', 'email', 'phone', 'profile', 'address', 'verified', 'createdAt', 'updatedAt'
    ];
}
