import React, { useState } from 'react';

export default function AnimatedInput({ 
    label,
    error,
    className = '',
    variant = 'default',
    size = 'md',
    ...props 
}) {
    const [focused, setFocused] = useState(false);
    
    const baseClasses = 'w-full rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1';
    
    const variants = {
        default: 'border-gray-300 focus:border-primary focus:ring-primary',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
    };
    
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-3 text-lg',
    };
    
    const classes = `${baseClasses} ${variants[error ? 'error' : 'default']} ${sizes[size]} ${className}`;
    
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700 animate-fade-in-up">
                    {label}
                </label>
            )}
            <input
                className={classes}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
            {error && (
                <p className="text-red-500 text-sm animate-shake">
                    {error}
                </p>
            )}
        </div>
    );
}
