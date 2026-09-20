/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar, ScreenId } from './components/layout/Sidebar';
import { EventLogPanel } from './components/layout/EventLogPanel';
import { ToastContainer } from './components/common/Toast';
import { TourModal } from './components/common/TourModal';
import { JurisdictionSelector } from './components/common/JurisdictionSelector';

import { DashboardScreen } from './components/screens/DashboardScreen';
import { LiveMapScreen } from './components/screens/LiveMapScreen';
import { JunctionsScreen } from './components/screens/JunctionsScreen';
import { EmergencyCorridorScreen } from './components/screens/EmergencyCorridorScreen';
import { OptimizerScreen } from './components/screens/OptimizerScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { EnvironmentScreen } from './components/screens/EnvironmentScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { JunctionId } from '../shared/types';

const MainLayout: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const { setSelectedJunctionId } = useSimulation();

  const handleNavigateToJunction = (jid: JunctionId) => {
    setSelectedJunctionId(jid);
    setActiveScreen('junctions');
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigateToJunctions={handleNavigateToJunction} />;
      case 'map':
        return <LiveMapScreen onSelectJunction={handleNavigateToJunction} />;
      case 'junctions':
        return <JunctionsScreen />;
      case 'emergency':
        return <EmergencyCorridorScreen />;
      case 'optimizer':
        return <OptimizerScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'environment':
        return <EnvironmentScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigateToJunctions={handleNavigateToJunction} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B1220] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Bar with simulation controls & clock */}
      <TopBar
        isLogOpen={isLogOpen}
        setIsLogOpen={setIsLogOpen}
        onOpenTour={() => setIsTourOpen(true)}
        onNavigateToEmergency={() => setActiveScreen('emergency')}
        onNavigateToSettings={() => setActiveScreen('settings')}
      />

      {/* Main Container: Sidebar + Content Area + Collapsible Event Log */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

        {/* Scrollable Center Screen Viewport */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 bg-[#0B1220] scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {activeScreen !== 'settings' && <JurisdictionSelector />}
            {renderActiveScreen()}
          </div>
        </main>

        {/* Right Collapsible Telemetry Event Log */}
        <EventLogPanel isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
      </div>

      {/* Interactive System Modals & Floating Notifications */}
      <TourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigate={(screenId: string) => setActiveScreen(screenId as ScreenId)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <MainLayout />
    </SimulationProvider>
  );
}
