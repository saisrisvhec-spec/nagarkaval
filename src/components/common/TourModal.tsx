import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, X, ShieldAlert, Cpu, Compass } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to SmartFlow Control Center',
    description: 'An advanced real-time traffic signal optimization and emergency green corridor command console monitoring 4 corridor junctions (J1-J4) and 50 background vehicles.',
    icon: <Compass className="w-8 h-8 text-cyan-400" />,
    tip: 'Observe top-bar simulated clock and scenario presets (Morning Peak, Evening Commute).',
  },
  {
    title: 'Adaptive & Quantum-Classical Control',
    description: 'Switch between Fixed-Time, Classical Adaptive (actuated queue/density weights), and simulated Hybrid QUBO/QAOA optimization to clear corridor latency by over 25%.',
    icon: <Cpu className="w-8 h-8 text-violet-400" />,
    tip: 'Compare efficiency matrices and QUBO cost heatmaps in the Optimizer screen.',
  },
  {
    title: 'Emergency Green Corridor Preemption',
    description: 'Dispatch Ambulance #51 to trigger an automated 8-stage green corridor lock across J1 → J2 → J3 with countdown clearance, saving up to 235 seconds.',
    icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
    tip: 'Click "Dispatch Ambulance #51" in the Emergency Corridor or Live Map screen.',
  },
  {
    title: 'Interactive Maps & Telemetry',
    description: 'Explore live animated vehicle dots, accident-prone heatmaps, bus conditional priority, fuel waste estimations, and full signal cycle Gantt records.',
    icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
    tip: 'Use the right panel to monitor color-coded live system logs anytime.',
  },
];

interface TourModalProps {
  isOpen?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (screenId: string) => void;
}

export const TourModal: React.FC<TourModalProps> = ({
  isOpen: controlledIsOpen,
  forceOpen = false,
  onClose,
  onNavigate,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('nagarkaval_tour_seen');
    if (!seen || forceOpen) {
      setInternalIsOpen(true);
    }
  }, [forceOpen]);

  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    localStorage.setItem('nagarkaval_tour_seen', 'true');
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!isModalOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[#182642] border border-[#27385E] rounded-xl shrink-0">
            {step.icon}
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Guided Tour · Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">{step.description}</p>

        <div className="bg-[#0B1220] border border-[#1F2A44] rounded-xl p-3 mb-6 flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
          <span className="text-xs text-slate-400">
            <strong className="text-slate-200">Operator Tip:</strong> {step.tip}
          </span>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F2A44]">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1220] bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-xl shadow-md shadow-cyan-400/20 transition-all cursor-pointer"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <span>Get Started</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
