import { Module } from 'vuex';
import Cookies from 'cookies-js';

import store, { RootState } from '@/store';
import { SystemOptionsState } from './types';

const initialState: SystemOptionsState = {
  nodeLabelsVisible: true,
  useBetaFeatures: Cookies.get('useBetaFeatures') === 'true',
  dataMutationBoundaryVisible: Cookies.get('dataMutationBoundaryVisible') === 'true',
};

const getters = {
};

const mutations = {
  /** Shows/hides the text labels on top of the diagram nodes. */
  toggleNodeLabels(state: SystemOptionsState) {
    state.nodeLabelsVisible = !state.nodeLabelsVisible;
  },

  /**
   * Completely overrides the system state using an object.
   * This should be called when the system is loaded from a previous session.
   */
  setState(state: SystemOptionsState, newState: SystemOptionsState) {
    Object.assign(state, newState);
  },

  /**
   * Uses new types of nodes in beta from VisFlow extensions.
   * This only affects options available in the UI.
   * Created beta nodes will not be affected.
   */
  toggleBetaFeatures(state: SystemOptionsState, value?: boolean) {
    state.useBetaFeatures = value !== undefined ? value : !state.useBetaFeatures;
    Cookies.set('useBetaFeatures', state.useBetaFeatures);
  },

  /**
   * Displays the boundary at which data is mutated.
   * This helps understand the separation between different subset flows.
   */
  toggleDataMutationBoundary(state: SystemOptionsState) {
    state.dataMutationBoundaryVisible = !state.dataMutationBoundaryVisible;

    store.commit('dataflow/toggleDataMutationBoundary', state.dataMutationBoundaryVisible);
    Cookies.set('dataMutationBoundary', state.dataMutationBoundaryVisible);
  },
};

const systemOptions: Module<SystemOptionsState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default systemOptions;
