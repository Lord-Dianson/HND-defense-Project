<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'Users';
    protected $primaryKey = 'ID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'ID', 'name', 'email', 'phone', 'password', 'role', 'status', 'profile','accountBalance','token', 'createdAt', 'updatedAt'
    ];

    protected $hidden = ['password'];
}
