import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import VueSelect from 'vue-select';
import _ from 'lodash';
import $ from 'jquery';

import { ColumnSelectOption } from '@/data/tabular-dataset';

@Component({
  components: {
    VueSelect,
  },
})
export default class ColumnList extends Vue {
  @Prop()
  private columns!: ColumnSelectOption[];
  @Prop()
  private initialSelectedColumns!: number[];

  private selected: ColumnSelectOption[] = [];

  private mounted() {
    this.selected = this.initialSelectedColumns.map(columnIndex => this.columns[columnIndex]);
  }

  /**
   * Handles dragging re-order.
   */
  private updated() {
    const valueMap: { [index: number]: ColumnSelectOption } = {};
    const $el = $(this.$el);

    const getNewOrder = (evt: Event, ui: JQueryUI.SortableUIParams): ColumnSelectOption[] => {
      const tags = $el.find('.selected-tag').not('.ui-sortable-helper');
      const values: number[] = [];
      for (const tag of tags) {
        const $tag = $(tag);
        if ($tag.hasClass('ui-sortable-placeholder')) {
          values.push(+(ui.item.attr('id') as string));
        } else {
          values.push(+($(tag).attr('id') as string));
        }
      }
      const newSelected = values.map(value => valueMap[value]);
      return newSelected;
    };

    $el.find('.dropdown-toggle').sortable({
      items: '> .selected-tag',
      start: () => {
        const tags = $el.find('.selected-tag').not('.ui-sortable-placeholder');
        _.each(tags, (tag, index) => {
          $(tag).attr('id', this.selected[index].value);
          valueMap[this.selected[index].value] = this.selected[index];
        });
      },
      change: (evt, ui) => {
        this.$emit('selectColumns', getNewOrder(evt, ui).map(column => column.value));
      },
      stop: (evt, ui) => {
        this.selected = getNewOrder(evt, ui);
        // Return false to cancel JQuery sortable to avoid changing the DOM at the same time with vue-select!
        return false;
      },
    });
  }

  @Watch('selected')
  private onSelectedChange() {
    this.$emit('selectColumns', this.selected.map(column => column.value));
  }
}