import React, { Suspense } from 'react';
import { SessionPayload } from '@/lib/session';
import { ConsoleRoleData } from '@/lib/console/console-data-loader';

import SuperadminConsoleView from './SuperadminConsoleView';
import PawasConsoleView from './PawasConsoleView';
import OperatorConsoleView from './OperatorConsoleView';
import LogistikConsoleView from './LogistikConsoleView';
import PersonilConsoleView from './PersonilConsoleView';
import ConsoleSessionWatcher from './ConsoleSessionWatcher';

interface ConsoleRoleRouterProps {
  session: SessionPayload;
  section: string;
  roleData: ConsoleRoleData;
}

export default function ConsoleRoleRouter({
  session,
  section,
  roleData,
}: ConsoleRoleRouterProps) {
  const {
    initialMasterData,
    initialSuperadminData,
    initialPawasData,
    initialOperatorData,
    initialComplaints,
    initialOfficer,
    initialLogbooks,
    initialPoliceOffices,
    initialFleetUnits,
    initialHotspots,
  } = roleData;

  return (
    <Suspense>
      <ConsoleSessionWatcher session={session} />
      {session.role === 'SUPERADMIN' && (
        <SuperadminConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialSuperadminData={initialSuperadminData}
        />
      )}
      {session.role === 'PAWAS' && (
        <PawasConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialPawasData={initialPawasData}
        />
      )}
      {session.role === 'OPERATOR' && (
        <OperatorConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialOperatorData={initialOperatorData}
        />
      )}
      {session.role === 'LOGISTIK' && (
        <LogistikConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
        />
      )}
      {session.role === 'PERSONIL' && (
        <PersonilConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialComplaints={initialComplaints}
          initialOfficer={initialOfficer}
          initialLogbooks={initialLogbooks}
          initialPoliceOffices={initialPoliceOffices}
          initialFleetUnits={initialFleetUnits}
          initialHotspots={initialHotspots}
        />
      )}
    </Suspense>
  );
}
