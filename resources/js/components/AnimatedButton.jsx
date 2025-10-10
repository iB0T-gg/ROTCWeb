import React from 'react';

export default function AnimatedButton({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md',
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    ...props 
}) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary hover-scale',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 hover-scale',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover-scale',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 hover-scale',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary hover-scale',
    };
    
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
            )}
            {children}
        </button>
    );
}
