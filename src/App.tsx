import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';

import { DashboardView } from './views/DashboardView';
import { ScenesView } from './views/ScenesView';
import { AiCrewView } from './views/AiCrewView';
import { ProductionBoardView } from './views/ProductionBoardView';
import { ResearchView } from './views/ResearchView';
import { RisksView } from './views/RisksView';
import { ScheduleView } from './views/ScheduleView';
import { SourcesView } from './views/SourcesView';
import { ProjectsView } from './views/ProjectsView';
import { NewProductionView } from './views/NewProductionView';
import { ScriptInputView } from './views/ScriptInputView';
import { AgentActivityView } from './views/AgentActivityView';
import { SettingsView } from './views/SettingsView';

import { storage } from './services/storage/StorageProvider';
import { aiManager, RequestedWorkflowMode } from './services/ai/AiManager';
import {
  Production,
  Scene,
  ProductionTask,
  ResearchQuestion,
  Risk,
  ContinuityIssue,
  ShootDay,
  Source,
  WorkflowRun,
  SystemSettings
} from './types';

export default function App() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [activeProductionId, setActiveProductionId] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('overview');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(storage.getSettings());

  const [currentProduction, setCurrentProduction] = useState<Production | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [research, setResearch] = useState<ResearchQuestion[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [continuity, setContinuity] = useState<ContinuityIssue[]>([]);
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [latestWorkflowRun, setLatestWorkflowRun] = useState<WorkflowRun | null>(null);

  // Initialize storage & state on mount
  useEffect(() => {
    storage.init();
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    const allProds = storage.getProductions();
    setProductions(allProds);

    let currentId = storage.getActiveProductionId();
    if (!currentId && allProds.length > 0) {
      currentId = allProds[0].id;
      storage.setActiveProductionId(currentId);
    }

    setActiveProductionId(currentId || '');

    if (currentId) {
      loadProductionData(currentId);
    } else {
      setCurrentProduction(null);
    }
  };

  const loadProductionData = (prodId: string) => {
    const prod = storage.getProductionById(prodId);
    if (prod) {
      const pScenes = storage.getScenes(prodId);
      const pTasks = storage.getTasks(prodId);
      const pResearch = storage.getResearch(prodId);
      const pRisks = storage.getRisks(prodId);
      const pContinuity = storage.getContinuity(prodId);
      const pShootDays = storage.getShootDays(prodId);
      const pSources = storage.getSources(prodId);

      const hydratedProd: Production = {
        ...prod,
        scenes: pScenes,
        tasks: pTasks,
        researchQuestions: pResearch,
        risks: pRisks,
        continuityIssues: pContinuity,
        shootDays: pShootDays,
        sources: pSources
      };

      setCurrentProduction(hydratedProd);
      setScenes(pScenes);
      setTasks(pTasks);
      setResearch(pResearch);
      setRisks(pRisks);
      setContinuity(pContinuity);
      setShootDays(pShootDays);
      setSources(pSources);
      setLatestWorkflowRun(storage.getLatestWorkflowRun(prodId));
    }
  };

  const handleNavigate = (view: string, prodId?: string) => {
    if (prodId && prodId !== activeProductionId) {
      setActiveProductionId(prodId);
      storage.setActiveProductionId(prodId);
      loadProductionData(prodId);
    }
    setActiveView(view);
  };

  const handleSelectProduction = (prodId: string) => {
    setActiveProductionId(prodId);
    storage.setActiveProductionId(prodId);
    loadProductionData(prodId);
    setActiveView('overview');
  };

  const handleProductionCreated = (newProd: Production) => {
    refreshAllData();
    setActiveProductionId(newProd.id);
    setCurrentProduction(newProd);
    setActiveView('script');
  };

  const handleRunScriptWorkflow = async (scriptText: string, requestedMode: RequestedWorkflowMode = 'AUTO') => {
    if (!currentProduction) return;
    const prodId = currentProduction.id;

    // PREVIOUS-RUN FLASH BUG FIX:
    // Before starting a new workflow, clear the active run presentation state
    setLatestWorkflowRun(null);
    setActiveView('build');

    currentProduction.scriptText = scriptText;
    storage.saveProduction(currentProduction);

    await aiManager.runScriptBreakdownWorkflow(
      currentProduction,
      (runUpdate) => {
        setLatestWorkflowRun({ ...runUpdate });
        if (runUpdate.status === 'COMPLETED' || runUpdate.status === 'FAILED') {
          loadProductionData(prodId);
        }
      },
      requestedMode
    );

    loadProductionData(prodId);
  };

  const handleUpdateTaskStatus = (taskId: string, status: ProductionTask['status']) => {
    if (!activeProductionId) return;
    storage.updateTaskStatus(activeProductionId, taskId, status);
    setTasks(storage.getTasks(activeProductionId));
  };

  const handleAddTask = (taskData: Partial<ProductionTask>) => {
    if (!activeProductionId) return;
    const newTask: ProductionTask = {
      id: `task_${Date.now()}`,
      productionId: activeProductionId,
      title: taskData.title || 'Untitled Task',
      category: taskData.category || 'Script Breakdown',
      priority: taskData.priority || 'HIGH',
      status: taskData.status || 'TO DO',
      description: taskData.description || '',
      createdAt: new Date().toISOString()
    };
    storage.saveTask(activeProductionId, newTask);
    setTasks(storage.getTasks(activeProductionId));
  };

  const handleUpdateRiskStatus = (riskId: string, status: Risk['status']) => {
    if (!activeProductionId) return;
    storage.updateRiskStatus(activeProductionId, riskId, status);
    setRisks(storage.getRisks(activeProductionId));

    if (currentProduction) {
      const updatedReadiness = storage.recalculateReadinessScore(activeProductionId);
      currentProduction.readinessScore = updatedReadiness;
      setCurrentProduction({ ...currentProduction });
    }
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleResetAllData = () => {
    storage.resetAllData();
    refreshAllData();
    setActiveView('overview');
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentProduction={currentProduction}
          activeView={activeView}
          onNavigate={handleNavigate}
          readinessScore={currentProduction?.readinessScore || 10}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header
            currentProduction={currentProduction}
            activeView={activeView}
            onNavigate={handleNavigate}
            onBuildProduction={() => {
              if (currentProduction) {
                handleNavigate('script', currentProduction.id);
              } else {
                handleNavigate('new-production');
              }
            }}
          />

          {/* Dynamic View Viewport */}
          <main className="flex-1 overflow-y-auto bg-zinc-950">
            {activeView === 'overview' && (
              <DashboardView
                production={currentProduction}
                scenes={scenes}
                tasks={tasks}
                research={research}
                risks={risks}
                continuity={continuity}
                shootDays={shootDays}
                sources={sources}
                latestRun={latestWorkflowRun}
                onNavigate={handleNavigate}
                onBuildProduction={() => {
                  if (currentProduction) {
                    handleNavigate('script', currentProduction.id);
                  } else {
                    handleNavigate('new-production');
                  }
                }}
                onUpdateRiskStatus={handleUpdateRiskStatus}
              />
            )}

            {activeView === 'scenes' && (
              <ScenesView
                scenes={scenes}
                risks={risks}
                research={research}
                continuity={continuity}
              />
            )}

            {activeView === 'crew' && (
              <AiCrewView
                workflowRun={latestWorkflowRun}
                aiProviderName={latestWorkflowRun?.metadata?.model || (systemSettings.aiProviderType === 'gemini' ? 'Google Gemini ADK' : 'Local Agent Simulator')}
                isMockProvider={systemSettings.aiProviderType === 'mock'}
                onReRunCrew={() => {
                  if (currentProduction) handleNavigate('script', currentProduction.id);
                }}
              />
            )}

            {activeView === 'board' && (
              <ProductionBoardView
                tasks={tasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddTask={handleAddTask}
              />
            )}

            {activeView === 'research' && (
              <ResearchView
                research={research}
                sources={sources}
                risks={risks}
                workflowRun={latestWorkflowRun}
              />
            )}

            {activeView === 'risks' && (
              <RisksView
                risks={risks}
                onUpdateRiskStatus={handleUpdateRiskStatus}
              />
            )}

            {activeView === 'schedule' && (
              <ScheduleView
                shootDays={shootDays}
                scenes={scenes}
              />
            )}

            {activeView === 'sources' && (
              <SourcesView
                sources={sources}
                workflowRun={latestWorkflowRun}
              />
            )}

            {activeView === 'projects' && (
              <ProjectsView
                productions={productions}
                activeProductionId={activeProductionId}
                onSelectProduction={handleSelectProduction}
                onNavigateNewProduction={() => setActiveView('new-production')}
                onRefreshData={refreshAllData}
              />
            )}

            {activeView === 'new-production' && (
              <NewProductionView
                onCreated={handleProductionCreated}
                onCancel={() => setActiveView('projects')}
              />
            )}

            {activeView === 'script' && currentProduction && (
              <ScriptInputView
                production={currentProduction}
                onRunWorkflow={handleRunScriptWorkflow}
                onBack={() => setActiveView('overview')}
              />
            )}

            {activeView === 'build' && currentProduction && (
              <AgentActivityView
                production={currentProduction}
                workflowRun={latestWorkflowRun}
                onComplete={() => setActiveView('overview')}
                onRunLocalSimulation={async () => {
                  if (!currentProduction) return;
                  const prodId = currentProduction.id;
                  setLatestWorkflowRun(null);
                  await aiManager.runScriptBreakdownWorkflow(
                    currentProduction,
                    (runUpdate) => {
                      setLatestWorkflowRun({ ...runUpdate });
                      if (runUpdate.status === 'COMPLETED' || runUpdate.status === 'FAILED') {
                        loadProductionData(prodId);
                      }
                    },
                    'LOCAL_SIMULATION'
                  );
                  loadProductionData(prodId);
                }}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                settings={systemSettings}
                onSaveSettings={handleSaveSettings}
                onResetData={handleResetAllData}
              />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
