<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;

class OtpSession extends Model
{
    protected $table = 'OtpSessions';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'jti',
        'email',
        'name',
        'phone',
        'otp_hash',
        'password_hash',
        'role',
        'profile',
        'created_at',
        'expires_at'
    ];

    // Auto-delete expired sessions
    public static function cleanup()
    {
        self::where('expires_at', '<', date('Y-m-d H:i:s'))->delete();
    }
}
