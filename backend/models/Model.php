<?php
namespace Models;

use Illuminate\Database\Eloquent\Model as EloquentModel;

class Model extends EloquentModel
{
    // Set timestamps = false by default (override in child if needed)
    public $timestamps = false;
    // Optionally set connection, table, etc. in child classes
}
