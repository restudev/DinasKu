<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkpoints', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->uuid('spd_document_id');

            $table->foreign('spd_document_id')
                ->references('id')
                ->on('spd_documents')
                ->cascadeOnDelete();

            $table->integer('urutan');

            $table->string('jenis');

            $table->string('lokasi');

            $table->string('qr_token')->nullable();

            $table->string('qr_image')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();

            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('foto_url')->nullable();

            $table->integer('jumlah_orang')->nullable();

            $table->text('catatan')->nullable();

            $table->timestamp('waktu_scan')->nullable();

            $table->enum('status', [
                'pending',
                'completed'
            ])->default('pending');

            $table->timestamps();
            $table->string('nama')->nullable();

            $table->string('nip')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {

            $table->dropColumn([
                'nama',
                'nip'
            ]);
        });
    }
};
