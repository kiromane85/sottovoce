import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AudioLines } from 'lucide-react';
import LanguagePicker from '@/components/LanguagePicker';
import { useApp } from '@/context/AppContext';

export default function Splash() {
    const { language } = useApp();
    const navigate = useNavigate();
    if (language) return <Navigate to="/home" replace />;
    return (
        <div className="app-noise min-h-screen flex flex-col">
            <div className="app-shell mx-auto w-full max-w-2xl px-4 md:px-6 py-6 md:py-10 flex-1 flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className="flex items-center gap-2 mb-8"
                >
                    <span className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                        <AudioLines className="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-semibold tracking-tight">Sottovoce</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mb-6"
                >
                    <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
                        Capisci ogni canzone, ovunque ti porti la strada.
                    </h1>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-prose">
                        Riconosci i brani in riproduzione, leggi i testi sincronizzati e ottieni la traduzione in tempo reale  perfetto anche per il display dell’auto.
                    </p>
                </motion.div>
                <LanguagePicker onContinue={() => navigate('/home')} />
            </div>
        </div>
    );
}
