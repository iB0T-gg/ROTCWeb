<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create test users if there are none in the database
        if (User::count() == 0) {
            // Create an admin user
            User::create([
                'student_number' => 'ADMIN000',
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => 'User',
                'email' => 'admin@example.com',
                'password' => Hash::make('admin@123'),
                'role' => 'admin',
                'status' => 'approved',
            ]);

            // Create a faculty user with general access (no company/battalion assigned)
            // Faculty users with NULL company/battalion can see all cadets
            User::create([
                'student_number' => 'FACULTY000',
                'first_name' => 'Faculty',
                'middle_name' => '',
                'last_name' => 'User',
                'email' => 'faculty@example.com',
                'password' => Hash::make('faculty@123'),
                'role' => 'faculty',
                'status' => 'approved',
                'company' => null,        // NULL = general access to all cadets
                'battalion' => null,      // NULL = general access to all cadets
                'platoon' => null,        // NULL = general access to all cadets
            ]);
            
            // Create a robust test set of cadet users (>= 111 cadets) with realistic-looking data
            $faker = \Faker\Factory::create();
            $totalCadets = 200;
            // Supporting lists mirroring dropdowns
            $heightOptions = [
                '4\'0"', '4\'1"', '4\'2"', '4\'3"', '4\'4"', '4\'5"', '4\'6"', '4\'7"', '4\'8"', '4\'9"', '4\'10"', '4\'11"',
                '5\'0"', '5\'1"', '5\'2"', '5\'3"', '5\'4"', '5\'5"', '5\'6"', '5\'7"', '5\'8"', '5\'9"', '5\'10"', '5\'11"',
                '6\'0"', '6\'1"', '6\'2"', '6\'3"', '6\'4"', '6\'5"', '6\'6"', '6\'7"', '6\'8"', '6\'9"', '6\'10"', '6\'11"', '7\'0"'
            ];
            $provinces = ['Bulacan','Pampanga','Nueva Ecija','Tarlac','Zambales','Bataan','Cavite','Laguna','Batangas','Rizal','Quezon','Pangasinan','Isabela','Cagayan','Ilocos Norte','Ilocos Sur','Aurora','Benguet','Ifugao'];
            $municipalities = ['Pulilan','Malolos','Meycauayan','San Jose del Monte','Hagonoy','Bustos','San Rafael','San Fernando','Angeles','Mabalacat','Tarlac City','Iba','Olongapo','Imus','Bacoor','Santa Rosa','Calamba','Batangas City','Antipolo','Tayabas','Dagupan','Ilagan','Tuguegarao','Laoag','Vigan','Baler','La Trinidad','Lagawe'];
            $barangays = ['Brgy. Paltao','Brgy. Poblacion','Brgy. San Jose','Brgy. San Roque','Brgy. San Isidro','Brgy. San Miguel','Brgy. San Pedro','Brgy. Santa Cruz','Brgy. San Juan','Brgy. San Antonio','Brgy. San Vicente'];
            for ($i = 1; $i <= $totalCadets; $i++) {
                $genderBool = (bool) random_int(0, 1);
                $gender = $genderBool ? 'Male' : 'Female';
                $firstName = $genderBool ? $faker->firstNameMale() : $faker->firstNameFemale();
                $lastName = $faker->lastName();
                $middleName = $faker->lastName(); // Use full last name as middle name
                $email = strtolower($firstName . '.' . $lastName . $i . '@example.com');
                $course = $faker->randomElement(['BSIT','BSCS','BSEE','BSA','BSED','BSCpE','BSBA']);
                $year = $faker->randomElement(['1G','2G','3G']);
                $section = $faker->randomElement(['G1','G2','G3']);
                $birthday = $faker->date('Y-m-d', '-18 years');
                // Match userProfile dropdowns
                $bloodType = $faker->randomElement(['A+','A-','B+','B-','AB+','AB-','O+','O-']);
                // Address format: Barangay, Municipality/City, Province (no house number)
                $province = $faker->randomElement($provinces);
                $municipality = $faker->randomElement($municipalities);
                $barangay = $faker->randomElement($barangays);
                $address = $barangay . ', ' . $municipality . ', ' . $province;
                $region = $faker->randomElement(['Region I','Region II','Region III','Region IV-A','Region IV-B','Region V','Region VI','Region VII','Region VIII','Region IX','Region X','Region XI','Region XII','Region XIII','NCR','CAR','BARMM']);
                // Use dropdown-style height values
                $height = $faker->randomElement($heightOptions);
                $phone = '09' . $faker->numberBetween(100000000, 999999999);
                $campus = $faker->randomElement(['Hagonoy Campus', 'Meneses Campus', 'Sarmiento Campus', 'Bustos Campus', 'San Rafael Campus', 'Main Campus']);

                User::create([
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'password' => Hash::make('password'),
                    // 10-digit student number. Parser uses last 8 digits for scanner mapping
                    'student_number' => sprintf('25%08d', $i),
                    'role' => 'user',
                    'status' => 'approved',
                    'gender' => $gender,
                    'course' => $course,
                    'year' => $year,
                    'section' => $section,
                    'birthday' => $birthday,
                    'blood_type' => $bloodType,
                    'address' => $address,
                    'region' => $region,
                    'height' => $height,
                    'phone_number' => $phone,
                    'campus' => $campus,
                    // platoon/company/battalion will be assigned after alphabetical sorting
                ]);
            }

            // After creation, assign platoon/company/battalion deterministically
            // NOTE: This only applies to cadets (role 'user'), not faculty or admin users
            // Faculty users should have NULL company/battalion for general access
            $cadets = User::where('role', 'user')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get();

            $companies = ['Alpha','Beta','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'];

            foreach ($cadets as $index => $cadet) {
                // 0-based groups of 37
                $groupIndex = intdiv($index, 37);
                // Determine platoon within a 3-group cycle (1st, 2nd, 3rd), repeating
                $platoonCycle = $groupIndex % 3; // 0,1,2 -> 1st/2nd/3rd
                $platoon = $platoonCycle === 0 ? '1st Platoon' : ($platoonCycle === 1 ? '2nd Platoon' : '3rd Platoon');
                // Company only advances after a full set of three platoons gets filled (i.e., per 3 groups)
                $companyIndex = intdiv($groupIndex, 3); // 0.. -> Alpha, Beta, Charlie...
                $company = $companies[$companyIndex % count($companies)];
                // Battalion by gender (case-insensitive; supports 'M'/'F')
                $g = is_string($cadet->gender) ? strtolower(trim($cadet->gender)) : '';
                $battalion = $g === 'male' || $g === 'm' ? '1st Battalion' : ($g === 'female' || $g === 'f' ? '2nd Battalion' : null);

                $cadet->platoon = $platoon;
                $cadet->company = $company;
                if ($battalion !== null) {
                    $cadet->battalion = $battalion;
                }
                $cadet->save();
            }
        }
    }
}
