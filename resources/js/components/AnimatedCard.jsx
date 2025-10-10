import React from 'react';

export default function AnimatedCard({ 
    children, 
    className = '', 
    variant = 'default',
    hover = true,
    animation = 'fade-in-up',
    delay = 0,
    ...props 
}) {
    const baseClasses = 'bg-white rounded-lg shadow-md transition-all duration-300';
    
    const variants = {
        default: 'border border-gray-200',
        primary: 'border border-primary/20 bg-primary/5',
        elevated: 'shadow-lg border border-gray-100',
        flat: 'shadow-sm border border-gray-100',
    };
    
    const hoverClasses = hover ? 'hover-lift' : '';
    const animationClasses = `animate-${animation}`;
    const delayClass = delay > 0 ? `animate-stagger-${Math.min(delay, 5)}` : '';
    
    const classes = `${baseClasses} ${variants[variant]} ${hoverClasses} ${animationClasses} ${delayClass} ${className}`;
    
    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
