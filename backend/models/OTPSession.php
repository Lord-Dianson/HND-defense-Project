<?php
namespace Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpSession extends Model
{
    // Matches migration: table name is OtpSessions
    protected $table = 'OtpSessions';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'jti', 'email', 'name', 'phone', 'otp_hash', 'password_hash', 'role', 'profile', 'created_at', 'expires_at'
    ];

    /**
     * Cleanup expired OTP sessions from DB
     */
    public static function cleanup()
    {
        try {
            // Delete sessions where expires_at is in the past
            return self::where('expires_at', '<', date('Y-m-d H:i:s'))->delete();
        } catch (\Exception $e) {
            // swallow errors here; controllers will handle failures
            return 0;
        }
    }
}
