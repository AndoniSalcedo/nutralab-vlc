'use client';
// Auto-generated bone registry — imported in app/layout.jsx
// Bones data is loaded directly by BoneyardSkeleton.jsx, so this file
// only needs to exist for backwards compatibility with the layout import.
import { registerBones } from 'boneyard-js/react';

import _teams_list from './teams-list.bones.json';
import _team_dashboard from './team-dashboard.bones.json';
import _team_supplementation from './team-supplementation.bones.json';
import _team_evolution from './team-evolution.bones.json';
import _team_menu from './team-menu.bones.json';
import _team_analytics from './team-analytics.bones.json';
import _team_config from './team-config.bones.json';
import _player_dashboard from './player-dashboard.bones.json';

registerBones({
  'teams-list': _teams_list,
  'team-dashboard': _team_dashboard,
  'team-supplementation': _team_supplementation,
  'team-evolution': _team_evolution,
  'team-menu': _team_menu,
  'team-analytics': _team_analytics,
  'team-config': _team_config,
  'player-dashboard': _player_dashboard,
});
