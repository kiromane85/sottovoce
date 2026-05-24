import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import Splash from '@/pages/Splash';
import Home from '@/pages/Home';
import Result from '@/pages/Result';
import History from '@/pages/History';

const Gate = ({ children }) => {
    const { language } = useApp();
    if (!language) return <Navigate to="/" replace />;
    return children;
};

function App() {
    return (
        <AppProvider>
            <div className="App min-h-screen bg-background text-foreground">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Splash />} />
                        <Route path="/home" element={<Gate><Home /></Gate>} />
                        <Route path="/result" element={<Gate><Result /></Gate>} />
                        <Route path="/result/:id" element={<Gate><Result /></Gate>} />
                        <Route path="/history" element={<Gate><History /></Gate>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster richColors closeButton position="top-center" />
            </div>
        </AppProvider>
    );
}

export default App;
