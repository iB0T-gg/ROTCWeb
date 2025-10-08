<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="{{ asset('images/ROTCLogo.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('images/ROTCLogo.png') }}">
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    @inertia
</body>
</html>