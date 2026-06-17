<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            $table->text('tanda_tangan_url')->nullable();
            $table->text('stempel_url')->nullable();
            $table->text('berita_acara_pdf')->nullable();
            $table->timestamp('signed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            $table->dropColumn([
                'tanda_tangan_url',
                'stempel_url',
                'berita_acara_pdf',
                'signed_at',
            ]);
        });
    }
};
