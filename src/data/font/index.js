import Ptypo, { templateNames } from 'prototypo-library';
import saveAs from 'save-as';
import { push } from 'react-router-redux';

export const CREATE_REQUESTED = 'font/CREATE_REQUESTED';
export const CREATE = 'font/CREATE';
export const IMPORT_PRESETS_REQUESTED = 'font/IMPORT_PRESETS_REQUESTED';
export const IMPORT_PRESETS = 'font/IMPORT_PRESETS';
export const LOAD_PRESETS_REQUESTED = 'font/LOAD_PRESETS_REQUESTED';
export const LOAD_PRESETS = 'font/LOAD_PRESETS';
export const SELECT_FONT_REQUESTED = 'font/SELECT_FONT_REQUESTED';
export const SELECT_FONT = 'font/SELECT_FONT';
export const DEFINE_NEED = 'font/DEFINE_NEED';
export const CHANGE_STEP = 'font/CHANGE_STEP';
export const UPDATE_VALUES = 'font/UPDATE_VALUES';
export const SELECT_CHOICE_REQUESTED = 'font/SELECT_CHOICE_REQUESTED';
export const SELECT_CHOICE = 'font/SELECT_CHOICE';
const initialState = {
  font: {},
  initialValues: {},
  presets: [],
  currentPreset: {},
  step: 0,
  isLoading: false,
  stepBaseValues: {},
  choicesMade: [],
  choicesFonts: [],
  currentParams: {},
  need: '',
};

const prototypoFontFactory = new Ptypo();

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
        presets: action.presets,
      };

    case CREATE_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };

    case CREATE:
      return {
        ...state,
        font: action.font,
        currentPreset: action.selectedFont,
        step: 1,
        initialValues: action.initialValues,
        isLoading: false,
        stepBaseValues: action.stepBaseValues,
      };

    case DEFINE_NEED:
      return {
        ...state,
        need: action.need,
      };

    case IMPORT_PRESETS_REQUESTED:
      return {
        ...state,
      };

    case IMPORT_PRESETS:
      return {
        ...state,
        presets: action.presetsArray,
      };

    case SELECT_FONT_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };

    case SELECT_FONT:
      return {
        ...state,
        font: action.font,
        currentPreset: action.selectedFont,
        step: 1,
        initialValues: action.initialValues,
        isLoading: false,
        stepBaseValues: action.stepBaseValues,
        choicesMade: [],
        choicesFonts: action.choicesFonts,
        currentParams: {},
      };

    case SELECT_CHOICE_REQUESTED:
      return {
        ...state,
      };

    case SELECT_CHOICE:
      return {
        ...state,
        font: action.font,
        currentParams: action.currentParams ? action.currentParams : state.currentParams,
        choicesMade: action.choicesMade,
      };

    case CHANGE_STEP:
      return {
        ...state,
        step: action.step,
      };

    case UPDATE_VALUES:
      return {
        ...state,
        font: action.font,
        choicesFonts: action.choicesFonts,
      };

    default:
      return state;
  }
};

export const createFont = font => (dispatch) => {
  dispatch({
    type: CREATE_REQUESTED,
  });
  prototypoFontFactory.createFont('peasy', templateNames[font.template.toUpperCase()]).then(
    (createdFont) => {
      createdFont.changeParams(font.baseValues);
      dispatch({
        type: CREATE,
        font: createdFont,
        selectedFont: font,
        initialValues: { ...font.baseValues },
        stepBaseValues: { ...font.baseValues },
      });
      dispatch(push('/customize'));
    });
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
  const { presets } = getState().font;
  const promiseArray = [];
  presets.forEach((preset, index) => {
    promiseArray.push(new Promise((resolve) => {
      prototypoFontFactory.createFont(`${preset.preset}${preset.variant}`, templateNames[preset.template.toUpperCase()]).then(
        (createdFont) => {
          createdFont.changeParams(preset.baseValues);
          resolve(true);
          presets[index].font = createdFont;
        });
    }));
  });
  Promise.all(promiseArray).then(() => {
    dispatch({
      type: LOAD_PRESETS,
      presets,
    });
    dispatch(push('/select'));
  });
};


export const selectFont = font => (dispatch, getState) => {
  const { presets, choicesFonts } = getState().font;
  dispatch({
    type: SELECT_FONT_REQUESTED,
  });
  presets.forEach((preset) => {
    if (preset.font.delete && (preset.font.fontName !== font.font.fontName)) {
      preset.font.delete();
    }
  });
  choicesFonts.forEach((choiceFont) => {
    if (choiceFont.delete) {
      choiceFont.delete();
    }
  });
  let maxStep = 0;
  font.steps.forEach((step) => {
    if (step.choices.length > maxStep) {
      maxStep = step.choices.length;
    }
  });
  const promiseArray = [];
  for (let i = 0; i < maxStep; i += 1) {
    promiseArray.push(new Promise((resolve) => {
      prototypoFontFactory.createFont(`choiceFont${i}`, templateNames[font.template.toUpperCase()]).then(
        (createdFont) => {
          createdFont.changeParams(font.baseValues);
          createdFont.changeParams(font.steps[0].choices[i].values);
          resolve(true);
          choicesFonts[i] = createdFont;
        });
    }));
  }
  Promise.all(promiseArray).then(() => {
    dispatch({
      type: SELECT_FONT,
      font: font.font,
      selectedFont: font,
      initialValues: { ...font.baseValues },
      stepBaseValues: { ...font.baseValues },
      choicesFonts,
    });
    dispatch(push('/customize'));
  });
};

export const defineNeed = need => (dispatch) => {
  dispatch({
    type: DEFINE_NEED,
    need,
  });
  dispatch(loadPresets());
};

const updateStepValues = step => (dispatch, getState) => {
  const {
    choicesFonts,
    font,
    currentPreset,
    currentParams,
    stepBaseValues,
    choicesMade,
  } = getState().font;
  const stepToUpdate = step || getState().font.step;
  currentPreset.steps[stepToUpdate - 1].choices.forEach((choice, index) => {
    const stepChoices = { ...choice.values };
    if (choicesMade[stepToUpdate]) {
      Object.keys(choicesMade[stepToUpdate]).forEach((key) => {
        if (!stepChoices[key]) {
          stepChoices[key] = currentPreset.baseValues[key];
        }
      });
    }
    choicesFonts[index].changeParams({ ...stepBaseValues, ...currentParams, ...stepChoices });
  });
  font.changeParams({ ...stepBaseValues, ...currentParams });
  dispatch({
    type: UPDATE_VALUES,
    font,
    choicesFonts,
  });
};

const updateFont = () => (dispatch, getState) => {
  const { font, currentParams, choicesFonts, stepBaseValues } = getState().font;
  font.changeParams({ ...stepBaseValues, ...currentParams });
  dispatch({
    type: UPDATE_VALUES,
    font,
    choicesFonts,
  });
};

export const goToStep = step => (dispatch, getState) => {
  const { currentPreset } = getState().font;
  switch (step) {
    case 0:
      dispatch(push('/'));
      break;
    case currentPreset.steps.length + 1:
      dispatch(updateFont());
      dispatch(push('/specimen'));
      break;
    default:
      dispatch(updateStepValues(step));
      dispatch({
        type: CHANGE_STEP,
        step,
      });
      break;
  }
};

export const stepForward = () => (dispatch, getState) => {
  const { font, choicesMade } = getState().font;
  let { step } = getState().font;
  choicesMade[step] = {};
  choicesMade[step].name = 'No choice';
  dispatch({
    type: SELECT_CHOICE,
    font,
    choicesMade,
  });
  dispatch(goToStep(step += 1));
};

export const selectChoice = choice => (dispatch, getState) => {
  const { font, choicesMade, currentPreset } = getState().font;
  let { step, currentParams } = getState().font;
  dispatch({
    type: SELECT_CHOICE_REQUESTED,
    params: choice.values,
  });
  const paramsToReset = {};
  if (choicesMade[step]) {
    Object.keys(choicesMade[step]).forEach((key) => {
      if (key !== 'name') {
        paramsToReset[key] = currentPreset.baseValues[key];
      }
    });
  }
  currentParams = {
    ...currentParams,
    ...paramsToReset,
    ...choice.values,
  };
  choicesMade[step] = choice.values;
  choicesMade[step].name = choice.name;
  dispatch({
    type: SELECT_CHOICE,
    font,
    currentParams,
    choicesMade,
  });
  dispatch(goToStep(step += 1));
};

export const download = () => (dispatch, getState) => {
  const { font } = getState().font;
  font.getArrayBuffer().then((data) => {
    const blob = new Blob([data], { type: 'application/x-font-opentype' });
    saveAs(blob, `${font.fontName}.otf`);
  });
};

