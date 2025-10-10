import React from 'react';

export default function LoadingPage() {
    return (
        <div className="fixed inset-0 bg-primary flex items-center justify-center z-50">
            <div className="flex flex-col items-center animate-fade-in">
                {/* ROTC Logo */}
                <div className="mb-8 transform transition-all duration-1000">
                    <img 
                        src="/images/ROTCLogo.png" 
                        alt="ROTC Logo" 
                        className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-lg"
                    />
                </div>
                
                {/* Loading Text */}
                <div className="text-white text-center space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-wide">
                            Bulacan State University
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg opacity-90 font-medium">
                            Reserve Officers' Training Corps
                        </p>
                    </div>
                    
                    {/* Loading Spinner */}
                    <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-white border-t-transparent"></div>
                    </div>
                </div>
                
            
            </div>
        </div>
    );
}
