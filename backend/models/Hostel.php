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
        'hostelID', 'name', 'location', 'image', 'capacity','roomsLeft', 'price', 'facilities','description','status', 'agentID', 'landlordPhone','verified','createdAt', 'updatedAt'
    ];
}
