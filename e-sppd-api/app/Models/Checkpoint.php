<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Checkpoint extends Model
{
    use HasUuids;

    protected $keyType    = 'string';
    public    $incrementing = false;
    protected $table      = 'checkpoints';

    protected $fillable = [
        'spd_document_id',
        'urutan',
        'jenis',
        'lokasi',
        'lokasi_tujuan',
        'nama',
        'nip',
        'jabatan',
        'qr_token',
        'qr_image',
        'latitude',
        'longitude',
        'foto_url',
        'jumlah_orang',
        'catatan',
        'waktu_scan',
        'status',
        'tanda_tangan_url',
        'stempel_url',
        'berita_acara_pdf', 
        'signed_at',
    ];

    protected $casts = [
        'waktu_scan' => 'datetime',
    ];

    public function document()
    {
        return $this->belongsTo(SpdDocument::class, 'spd_document_id');
    }
}
