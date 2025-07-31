<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_number' => fake()->unique()->numerify('########'),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'last_name' => fake()->lastName(),
            'year_course_section' => fake()->randomElement(['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']),
            'email' => fake()->unique()->safeEmail(),
            'phone_number' => fake()->numerify('09#########'),
            'password' => static::$password ??= Hash::make('password'),
            'address' => fake()->address(),
            'region' => fake()->numberBetween(1, 17),
            'height' => fake()->randomFloat(1, 4.0, 7.0),
            'blood_type' => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
            'birthday' => fake()->date(),
            'role' => 'user',
            'status' => 'pending',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
