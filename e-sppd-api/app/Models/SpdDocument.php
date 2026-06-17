<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SpdDocument extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'spd_documents';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [

        'nomor_spd',

        'pegawai_nama',
        'pegawai_nip',

        'tempat_berangkat',
        'tempat_tujuan',

        'tanggal_berangkat',
        'tanggal_kembali',

        'file_asli',
        'file_final',

        'checkpoint_count',

        'status'
    ];

    protected $casts = [

        'tanggal_berangkat' => 'date',
        'tanggal_kembali' => 'date'

    ];

    public function checkpoints()
    {
        return $this->hasMany(
            Checkpoint::class,
            'spd_document_id'
        );
    }
}
