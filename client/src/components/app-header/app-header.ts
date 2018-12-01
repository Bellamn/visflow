import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import DiagramMenu from '@/components/app-header/diagram-menu/diagram-menu';
import EditMenu from '@/components/app-header/edit-menu/edit-menu';
import OptionsMenu from '@/components/app-header/options-menu/options-menu';
import HelpMenu from '@/components/app-header/help-menu/help-menu';
import UserBar from '@/components/user-bar/user-bar';
import DiagramBar from '@/components/diagram-bar/diagram-bar';
import DatasetBar from '@/components/dataset-bar/dataset-bar';
import DragBar from '@/components/drag-bar/drag-bar';
import VisModeBar from '@/components/vis-mode-bar/vis-mode-bar';
import FlowsenseBar from '@/components/flowsense-bar/flowsense-bar';
import ExperimentBar from '@/components/experiment-bar/experiment-bar';

@Component({
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
    UserBar,
    DiagramBar,
    DatasetBar,
    DragBar,
    VisModeBar,
    FlowsenseBar,
    ExperimentBar,
  },
})
export default class AppHeader extends Vue {
  @ns.experiment.Getter('isInExperiment') private isInExperiment!: boolean;
  @ns.flowsense.State('enabled') private flowsenseEnabled!: boolean;
}
