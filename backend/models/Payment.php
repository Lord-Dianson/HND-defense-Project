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
        'paymentID', 'studentID', 'hostelID', 'landlordID', 'amount', 'status', 'reference', 'paidAt', 'createdAt', 'updatedAt'
    ];
}
