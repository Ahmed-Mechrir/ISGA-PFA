<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UtilisateurSeeder::class,
            AgenceSeeder::class,
            LogementSeeder::class,
            ReservationSeeder::class,
            PaiementSeeder::class,
            AvisSeeder::class,
        ]);
    }
}
