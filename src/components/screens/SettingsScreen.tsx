import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Key,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { SimulationSettings } from '../../../shared/types';
import { Tooltip } from '../common/Tooltip';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, resetSettingsToDefault } = useSimulation();

  // Local state for Google Maps key input
  const [apiKeyInput, setApiKeyInput] = useState(settings.googleMapsApiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Sliders: weights auto-normalization
  const handleWeightChange = (field: 'weightQueue' | 'weightDensity' | 'weightWait', val: number) => {
    const rawVal = Math.max(0.05, Math.min(0.9, val));
    let newWeights = {
      weightQueue: settings.weightQueue,
      weightDensity: settings.weightDensity,
      weightWait: settings.weightWait,
      [field]: rawVal,
    };

    // Normalize so sum is exactly 1.0
    const sum = newWeights.weightQueue + newWeights.weightDensity + newWeights.weightWait;
    updateSettings({
      weightQueue: Number((newWeights.weightQueue / sum).toFixed(2)),
      weightDensity: Number((newWeights.weightDensity / sum).toFixed(2)),
      weightWait: Number((newWeights.weightWait / sum).toFixed(2)),
    });
  };

  // Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'Aggressive Green Wave':
        updateSettings({
          weightQueue: 0.5,
          weightDensity: 0.3,
          weightWait: 0.2,
          minGreenSeconds: 20,
          maxGreenSeconds: 75,
          busPriorityEnabled: true,
          emergencyPreemptionEnabled: true,
        });
        break;
      case 'Pedestrian-Friendly':
        updateSettings({
          weightQueue: 0.2,
          weightDensity: 0.2,
          weightWait: 0.6,
          minGreenSeconds: 15,
          maxGreenSeconds: 45,
          pedestrianClearanceSeconds: 18,
        });
        break;
      case 'High-Capacity Corridor':
        updateSettings({
          weightQueue: 0.6,
          weightDensity: 0.3,
          weightWait: 0.1,
          minGreenSeconds: 25,
          maxGreenSeconds: 90,
          busPriorityEnabled: true,
        });
        break;
      case 'Default':
      default:
        resetSettingsToDefault();
        break;
    }
  };

  const saveApiKey = () => {
    updateSettings({ googleMapsApiKey: apiKeyInput.trim() });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-xl shadow-md shadow-cyan-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Corridor Parameter Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune adaptive weights, safety yellow clearance intervals, priority thresholds, and map credentials
            </p>
          </div>
        </div>

        <button
          onClick={resetSettingsToDefault}
          className="px-4 py-2 bg-[#0B1220] hover:bg-slate-800 text-slate-300 border border-[#1F2A44] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          Reset to Defaults
        </button>
      </div>

      {/* PRESETS */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Quick Presets
          </h3>
          <span className="text-xs text-slate-400 font-mono">One-click strategy adjustment</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              name: 'Default',
              desc: 'Balanced classical weights (0.4 Queue, 0.3 Density, 0.3 Wait).',
            },
            {
              name: 'Aggressive Green Wave',
              desc: 'Extends arterial greens up to 75s; prioritizes heavy queues.',
            },
            {
              name: 'Pedestrian-Friendly',
              desc: 'Enforces 18s walk intervals and shorter cycle times for crossings.',
            },
            {
              name: 'High-Capacity Corridor',
              desc: 'Maximum vehicle flushing with 90s arterial limits and bus priority.',
            },
          ].map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.name)}
              className="p-3.5 rounded-xl border border-[#1F2A44] bg-[#0B1220] hover:border-cyan-500/50 hover:bg-[#152238] transition-all text-left cursor-pointer group"
            >
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 block">
                {p.name}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-snug">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ADAPTIVE WEIGHTS & SIGNAL INTERVAL TIMINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Adaptive Weights Sliders */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Adaptive Objective Weights (Sum = 1.0)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative influence of telemetry metrics on dynamic green allocation
              </p>
            </div>
            <Tooltip
              content="The adaptive controller computes a priority score P = w1·Queue + w2·Density + w3·Wait to dynamically award bonus seconds to approaching traffic."
              iconOnly
            />
          </div>

          <div className="space-y-4">
            {/* Queue Length Weight */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Queue Length Weight (w₁)</span>
                <span className="text-cyan-400 font-bold">{settings.weightQueue}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={settings.weightQueue}
                onChange={(e) => handleWeightChange('weightQueue', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Density Weight */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Traffic Density Weight (w₂)</span>
                <span className="text-cyan-400 font-bold">{settings.weightDensity}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={settings.weightDensity}
                onChange={(e) => handleWeightChange('weightDensity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Wait Time Weight */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">User Wait Time Weight (w₃)</span>
                <span className="text-cyan-400 font-bold">{settings.weightWait}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={settings.weightWait}
                onChange={(e) => handleWeightChange('weightWait', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#0B1220] rounded-xl border border-[#1F2A44] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total Weight Normalized:</span>
              <span className="text-emerald-400 font-bold">
                {(settings.weightQueue + settings.weightDensity + settings.weightWait).toFixed(2)} / 1.00
              </span>
            </div>
          </div>
        </div>

        {/* Phase Interval Timings */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Signal Timing Constraints (Seconds)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bounds on signal cycle flexibility and pedestrian safety margins
              </p>
            </div>
            <Tooltip content="Enforces deterministic safety intervals ensuring signals never drop below minimum safe clearance." iconOnly />
          </div>

          <div className="space-y-3.5">
            {/* Min Green Time */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Minimum Green Time</span>
                <span className="text-white font-bold">{settings.minGreenSeconds}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                step="1"
                value={settings.minGreenSeconds}
                onChange={(e) => updateSettings({ minGreenSeconds: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Max Green Time */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Maximum Green Time</span>
                <span className="text-white font-bold">{settings.maxGreenSeconds}s</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={settings.maxGreenSeconds}
                onChange={(e) => updateSettings({ maxGreenSeconds: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Yellow Time */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Yellow Clearance Time</span>
                <span className="text-white font-bold">{settings.yellowSeconds}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="6"
                step="1"
                value={settings.yellowSeconds}
                onChange={(e) => updateSettings({ yellowSeconds: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Pedestrian Clearance */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Pedestrian Clearance Time</span>
                <span className="text-white font-bold">{settings.pedestrianClearanceSeconds}s</span>
              </div>
              <input
                type="range"
                min="8"
                max="25"
                step="1"
                value={settings.pedestrianClearanceSeconds}
                onChange={(e) =>
                  updateSettings({ pedestrianClearanceSeconds: parseInt(e.target.value) })
                }
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOGGLES & GOOGLE MAPS KEY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Functional Feature Toggles */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight mb-2">
            Safety & Actuation Toggles
          </h3>

          {/* Bus Priority */}
          <div className="flex items-center justify-between p-3 bg-[#0B1220] rounded-xl border border-[#1F2A44]">
            <div>
              <span className="text-xs font-bold text-white block">Bus Transit Priority</span>
              <span className="text-[11px] text-slate-400">
                Grant conditional +12s green extensions to transit and school buses
              </span>
            </div>
            <button
              onClick={() => updateSettings({ busPriorityEnabled: !settings.busPriorityEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.busPriorityEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.busPriorityEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Emergency Preemption */}
          <div className="flex items-center justify-between p-3 bg-[#0B1220] rounded-xl border border-[#1F2A44]">
            <div>
              <span className="text-xs font-bold text-white block">Emergency Preemption</span>
              <span className="text-[11px] text-slate-400">
                Allow Ambulance #51 to engage all-red cross clearance green waves
              </span>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  emergencyPreemptionEnabled: !settings.emergencyPreemptionEnabled,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.emergencyPreemptionEnabled ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.emergencyPreemptionEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Accident Alerts */}
          <div className="flex items-center justify-between p-3 bg-[#0B1220] rounded-xl border border-[#1F2A44]">
            <div>
              <span className="text-xs font-bold text-white block">Accident Hotspot Alerts</span>
              <span className="text-[11px] text-slate-400">
                Highlight high-risk intersections and history collision flags on map
              </span>
            </div>
            <button
              onClick={() =>
                updateSettings({ accidentZoneAlertsEnabled: !settings.accidentZoneAlertsEnabled })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.accidentZoneAlertsEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.accidentZoneAlertsEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3 bg-[#0B1220] rounded-xl border border-[#1F2A44]">
            <div className="flex items-center gap-2">
              {settings.soundEffectsEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">Synthesized Audio Alerts</span>
                <span className="text-[11px] text-slate-400">
                  Web Audio API tone synthesis for emergency sirens and phase transitions
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.soundEffectsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.soundEffectsEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Google Maps API Key Input & Fallback Status */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Map Rendering Engine & Key
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              If an API key is provided, SmartFlow can load real-world satellite and street imagery. Otherwise, it automatically defaults to the high-performance SVG schematic digital twin with full parity.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">
                GOOGLE MAPS JAVASCRIPT API KEY
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-[#0B1220] border border-[#1F2A44] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={saveApiKey}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Status Indicator Chip */}
          <div className="p-3.5 bg-[#0B1220] rounded-xl border border-[#1F2A44] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.googleMapsApiKey ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
              />
              <span className="text-slate-300 font-mono">
                {settings.googleMapsApiKey
                  ? 'Key Configured · Google Maps Active'
                  : 'No Key · High-Res SVG Vector Engine Active'}
              </span>
            </div>
            {apiKeySaved && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
