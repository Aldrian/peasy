import Ptypo, { templateNames } from 'prototypo-library';
import { push } from 'react-router-redux';
import { setStable } from '../ui';
import { storeCreatedFont } from '../createdFonts';

export const IMPORT_PRESETS_REQUESTED = 'presets/IMPORT_PRESETS_REQUESTED';
export const IMPORT_PRESETS = 'presets/IMPORT_PRESETS';
export const LOAD_PRESETS_REQUESTED = 'presets/LOAD_PRESETS_REQUESTED';
export const LOAD_PRESETS = 'presets/LOAD_PRESETS';
const initialState = {
  loadedPresetsName: [],
  importedPresets: [],
  isLoading: false,
};

const templates = {
  elzevir: 'ELZEVIR',
  venus: 'GROTESK',
  'john-fell': 'FELL',
  gfnt: 'SPECTRAL',
  antique: 'ANTIQUE',
};

const prototypoFontFactory = new Ptypo('b1f4fb23-7784-456e-840b-f37f5a647b1c');

export default (state = initialState, action) => {
  switch (action.type) {
    case LOAD_PRESETS_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };

    case LOAD_PRESETS:
      return {
        ...state,
        isLoading: false,
        loadedPresetsName: action.loadedPresetsName,
      };

    case IMPORT_PRESETS_REQUESTED:
      return {
        ...state,
      };

    case IMPORT_PRESETS:
      return {
        ...state,
        importedPresets: action.presetsArray,
      };

    default:
      return state;
  }
};


export const importPresets = presets => (dispatch) => {
  dispatch({
    type: IMPORT_PRESETS_REQUESTED,
  });
  const presetsArray = [];
  Object.keys(presets).forEach((key) => {
    presetsArray.push(presets[key]);
  });
  dispatch({
    type: IMPORT_PRESETS,
    presetsArray,
  });
};

export const loadPresets = () => (dispatch, getState) => {
  dispatch({
    type: LOAD_PRESETS_REQUESTED,
  });
  const { importedPresets } = getState().presets;
  const promiseArray = [];
  const loadedPresetsName =  [];
  importedPresets.forEach((preset, index) => {
    promiseArray.push(new Promise((resolve) => {
      prototypoFontFactory.createFont(`${preset.preset}${preset.variant}`, templateNames[templates[preset.template]]).then(
        (createdFont) => {
          createdFont.changeParams(preset.baseValues);
          resolve(true);
          loadedPresetsName[index] = `${preset.preset}${preset.variant}`;
          dispatch(storeCreatedFont(createdFont, `${preset.preset}${preset.variant}`));
        });
    }));
  });
  Promise.all(promiseArray).then(() => {
    dispatch({
      type: LOAD_PRESETS,
      loadedPresetsName,
    });
    dispatch(push('/select'));
    dispatch(setStable());
  });
};

export const reloadPresets = () => (dispatch) => {
  dispatch(loadPresets());
};
