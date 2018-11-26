import { Vue, Component, Prop } from 'vue-property-decorator';
import $ from 'jquery';

import ns from '@/store/namespaces';
import { NodeType, CreateNodeOptions } from '@/store/dataflow/types';
import { DRAG_TIME_THRESHOLD } from '@/common/constants';
import { elementContains } from '@/common/util';


@Component
export default class NodeList extends Vue {
  @ns.dataflow.Mutation('createNode') private createNode!: (options: CreateNodeOptions) => void;
  @ns.interaction.Mutation('nodeListDragStarted') private nodeListDragStarted!: () => void;
  @ns.interaction.Mutation('nodeListDragEnded') private nodeListDragEnded!: () => void;

  // Creates node at the mouse's location on click.
  @Prop({ default: false })
  private createNodeAtMouseOnClick!: boolean;

  @Prop()
  private nodeTypes!: NodeType[];

  @Prop({
    default: 2,
  })
  private nodeTypesPerRow!: number;

  private mounted() {
    // Inits the drag behavior on node type buttons when the node panel is mounted.
    this.initDrag();
  }

  private updated() {
    this.initDrag();
  }

  /** Initializes the drag-and-drop behavior on the node buttons. */
  private initDrag() {
    const clickHandler = (nodeType: NodeType, x?: number, y?: number) => {
      // If "createNodeAtMouseOnClick" is not set, create the node at the screen's center.
      this.createNode({
        type: nodeType.id,
        dataflowCenterX: this.createNodeAtMouseOnClick && x !== undefined ? x : Math.floor(window.innerWidth * .5),
        dataflowCenterY: this.createNodeAtMouseOnClick && y !== undefined ? y : Math.floor(window.innerHeight * .45),
        activate: true,
      });
      this.$emit('nodeCreated');
    };

    this.nodeTypes.forEach((nodeType: NodeType) => {
      const button = $(this.$el).find(`#${nodeType.id}`);
      let startTime: Date;
      button.draggable({
        helper: 'clone',
        start: (evt: Event) => {
          startTime = new Date();
          this.nodeListDragStarted();
        },
        stop: (evt: Event) => {
          this.nodeListDragEnded();
          const x = (evt as MouseEvent).pageX;
          const y = (evt as MouseEvent).pageY;
          if (new Date().getTime() - startTime.getTime() <= DRAG_TIME_THRESHOLD) {
            // If mouse is released soon after pressing down, we consider it a click.
            clickHandler(nodeType);
            return;
          }
          if (elementContains(this.$el, x, y)) {
            // If the button is dropped on the node panel, do nothing so as to cancel the drag.
            return;
          }
          this.createNode({
            type: nodeType.id,
            dataflowCenterY: Math.floor(y),
            dataflowCenterX: Math.floor(x),
            activate: true,
          });
          this.$emit('nodeCreated');
        },
      });
      // If the button is clicked instead of dragged, create the node near the center of the screen.
      button.click((evt: JQuery.Event) => clickHandler(nodeType, evt.pageX, evt.pageY));
    });
  }

  get nodeTypeRows(): NodeType[][] {
    const rows: NodeType[][] = [];
    let i = 0;
    while (i < this.nodeTypes.length) {
      rows.push(this.nodeTypes.slice(i, i + this.nodeTypesPerRow));
      i += this.nodeTypesPerRow;
    }
    return rows;
  }
}
