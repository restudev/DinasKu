<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spd_documents', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->string('nomor_spd')->nullable();

            $table->string('pegawai_nama')->nullable();

            $table->string('pegawai_nip')->nullable();

            $table->string('tempat_berangkat')->nullable();

            $table->string('tempat_tujuan')->nullable();

            $table->date('tanggal_berangkat')->nullable();

            $table->date('tanggal_kembali')->nullable();

            $table->string('file_asli')->nullable();

            $table->string('file_final')->nullable();

            $table->integer('checkpoint_count')->default(0);

            $table->string('status')->default('uploaded');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spd_documents');
    }
};
