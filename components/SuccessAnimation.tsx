'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface SuccessAnimationProps {
  visible: boolean;
  onClose: () => void;
  onNewTicket: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ visible, onClose, onNewTicket }) => {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      
      // Animación escalonada
      setTimeout(() => setShowContent(true), 200);
      setTimeout(() => setShowButton(true), 1200);
    } else {
      document.body.style.overflow = 'unset';
      setShowContent(false);
      setShowButton(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Estilos CSS en el head del documento */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-appear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }

        .animate-pulse-ring-delayed {
          animation: pulse-ring 2s ease-out infinite 0.5s;
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out both;
        }

        .animate-check-appear {
          animation: check-appear 1s ease-out 0.4s both;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 400% 400%;
          animation: gradient-shift 8s ease infinite;
        }

        .text-shadow-glow {
          text-shadow: 0 4px 20px rgba(59, 130, 246, 0.5), 0 2px 4px rgba(0,0,0,0.3);
        }

        .text-shadow-soft {
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .hover-scale-105:hover {
          transform: scale(1.05);
        }

        .hover-rotate:hover {
          transform: rotate(180deg);
        }
      `}</style>

      <div 
        className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[9999] animate-gradient"
        style={{
          background: 'radial-gradient(circle at center, rgb(59, 130, 246) 0%, rgb(15, 23, 42) 100%)',
        }}
      >
        {/* Partículas de fondo animadas */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center z-10 max-w-sm sm:max-w-md mx-auto px-4">
          {/* Contenedor del ícono con animaciones */}
          <div 
            className={`relative mb-6 sm:mb-8 transform transition-all duration-800 ease-out ${
              showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-8'
            }`}
          >
            {/* Círculos de pulso de fondo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 sm:border-4 border-white/20 ${
                  showContent ? 'animate-pulse-ring-delayed' : ''
                }`}
              />
              <div 
                className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-2 border-white/10 ${
                  showContent ? 'animate-pulse-ring' : ''
                }`}
              />
            </div>

            {/* Círculo principal del ícono */}
            <div 
              className={`relative w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl ${
                showContent ? 'animate-bounce-in' : ''
              }`}
              style={{
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3)',
              }}
            >
              <CheckCircle 
                className={`text-white w-12 h-12 sm:w-16 sm:h-16 ${
                  showContent ? 'animate-check-appear' : ''
                }`}
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                }}
              />
            </div>
          </div>

          {/* Texto principal */}
          <div 
            className={`mb-8 sm:mb-12 transform transition-all duration-800 ease-out ${
              showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '0.6s' }}
          >
            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-white leading-tight text-shadow-glow"
              style={{
                letterSpacing: '-0.02em'
              }}
            >
              ¡Enviado Exitosamente!
            </h1>
            
            <p 
              className="text-sm sm:text-base lg:text-lg text-white/80 font-medium max-w-xs sm:max-w-sm mx-auto leading-relaxed text-shadow-soft px-2"
            >
              Tu solicitud ha sido recibida y será procesada pronto
            </p>
          </div>
          
          {/* Botón con animación de entrada */}
          <div 
            className={`transform transition-all duration-600 ease-out ${
              showButton ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}
          >
            <Button
              onClick={onNewTicket}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl sm:rounded-2xl px-6 sm:px-10 py-3 sm:py-4 h-auto text-sm sm:text-base lg:text-lg font-bold shadow-2xl transition-all duration-300 min-w-[180px] sm:min-w-[220px] hover-scale-105 group"
              style={{
                boxShadow: '0 6px 24px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover-rotate group-hover:rotate-180" />
                <span>Nuevo Ticket</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessAnimation;