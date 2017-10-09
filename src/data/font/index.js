import Ptypo, { templateNames } from 'prototypo-library';
import saveAs from 'save-as';
import { push } from 'react-router-redux';
import { request } from 'graphql-request';
import { loadPresets } from '../presets';
import { setUnstable, setStable } from '../ui';
import { storeChosenWord } from '../user';
import { DEFAULT_UI_WORD, GRAPHQL_API } from '../constants';
import { storeCreatedFont, deleteCreatedFont } from '../createdFonts';
import { getSelectedCount, updateSelectedCount, getSpecialChoiceSelectedCount } from '../queries';

export const CREATE_REQUESTED = 'font/CREATE_REQUESTED';
export const CREATE = 'font/CREATE';
export const SELECT_FONT_REQUESTED = 'font/SELECT_FONT_REQUESTED';
export const SELECT_FONT = 'font/SELECT_FONT';
export const DEFINE_NEED = 'font/DEFINE_NEED';
export const CHANGE_STEP = 'font/CHANGE_STEP';
export const UPDATE_VALUES = 'font/UPDATE_VALUES';
export const SELECT_CHOICE_REQUESTED = 'font/SELECT_CHOICE_REQUESTED';
export const SELECT_CHOICE = 'font/SELECT_CHOICE';
export const RELOAD_FONTS = 'font/RELOAD_FONTS';
export const FINISH_EDITING = 'font/FINISH_EDITING';

const initialState = {
  fontName: '',
  initialValues: {},
  currentPreset: {
    font: {},
  },
  step: 0,
  isLoading: false,
  stepBaseValues: {},
  choicesMade: [null],
  choicesFontsName: [],
  sliderFontName: '',
  currentParams: {},
  need: '',
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
    case CREATE_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };

    case CREATE:
      return {
        ...state,
        fontName: action.fontName,
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

    case SELECT_FONT_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };

    case SELECT_FONT:
      return {
        ...state,
        fontName: action.fontName,
        currentPreset: action.selectedFont,
        step: 1,
        initialValues: action.initialValues,
        isLoading: false,
        stepBaseValues: action.stepBaseValues,
        choicesMade: [null],
        choicesFontsName: action.choicesFontsName,
        currentParams: {},
        sliderFontName: action.sliderFontName,
      };

    case SELECT_CHOICE_REQUESTED:
      return {
        ...state,
      };

    case FINISH_EDITING:
      return {
        ...state,
        step: action.step,
        choicesMade: action.choicesMade,
      };

    case SELECT_CHOICE:
      return {
        ...state,
        fontName: action.fontName,
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
        fontName: action.fontName,
        choicesFontsName: action.choicesFontsName,
        sliderFontName: action.sliderFontName,
      };

    case RELOAD_FONTS:
      return {
        ...state,
        currentPreset: action.currentPreset,
        choicesFontsName: action.choicesFontsName,
        fontName: action.fontName,
        step: action.step,
        sliderFontName: action.sliderFontName,
      };

    default:
      return state;
  }
};

export const createFont = font => (dispatch) => {
  dispatch({
    type: CREATE_REQUESTED,
  });
  prototypoFontFactory
    .createFont('peasy', templateNames[templates[font.template]])
    .then((createdFont) => {
      createdFont.changeParams(font.baseValues);
      dispatch(storeCreatedFont(createdFont, 'peasy'));
      dispatch({
        type: CREATE,
        fontName: 'peasy',
        selectedFont: font,
        initialValues: { ...font.baseValues },
        stepBaseValues: { ...font.baseValues },
      });
      dispatch(push('/customize'));
    });
};

export const selectFont = font => (dispatch, getState) => {
  console.log('===============SELECT FONT===============');
  const { choicesFontsName = [] } = getState().font;
  const { loadedPresetsName } = getState().presets;
  const { fonts } = getState().createdFonts;
  dispatch({
    type: SELECT_FONT_REQUESTED,
  });
  const selectedFontName = `${font.preset}${font.variant}`;
  loadedPresetsName.forEach((preset) => {
    if (preset !== selectedFontName) {
      dispatch(deleteCreatedFont(preset));
    }
  });
  choicesFontsName.forEach((choiceFont) => {
    dispatch(deleteCreatedFont(choiceFont));
  });
  let maxStep = 0;
  font.steps.forEach((step) => {
    if (step.choices.length > maxStep) {
      maxStep = step.choices.length;
    }
  });
  const promiseArray = [];
  for (let i = 0; i < maxStep; i += 1) {
    console.log(`Creating choiceFont${i} from template ${templateNames[templates[font.template]]}`);
    promiseArray.push(
      new Promise((resolve) => {
        prototypoFontFactory
          .createFont(`choiceFont${i}`, templateNames[templates[font.template]])
          .then((createdFont) => {
            createdFont.changeParams(font.baseValues);
            createdFont.changeParams(font.steps[0].choices[i].values);
            resolve(true);
            console.log(`Changing params for choiceFont${i}`);
            console.log({
              ...font.baseValues,
              ...font.steps[0].choices[i].values,
            });
            dispatch(storeCreatedFont(createdFont, `choiceFont${i}`));
            choicesFontsName[i] = `choiceFont${i}`;
          });
      }),
    );
  }
  let sliderFontName = '';
  promiseArray.push(
      new Promise((resolve) => {
        prototypoFontFactory
          .createFont('sliderFont', templateNames[templates[font.template]])
          .then((createdFont) => {
            createdFont.changeParams(font.baseValues);
            sliderFontName = 'sliderFont';
            dispatch(storeCreatedFont(createdFont, 'sliderFont'));
            resolve(true);
          });
      }),
    );
  Promise.all(promiseArray).then(() => {
    request(GRAPHQL_API, getSelectedCount('Preset', font.id))
      .then(data => request(GRAPHQL_API, updateSelectedCount('Preset', font.id, data.Preset.selected + 1)))
      .catch(error => console.log(error));
    dispatch({
      type: SELECT_FONT,
      fontName: selectedFontName,
      selectedFont: font,
      initialValues: { ...font.baseValues },
      stepBaseValues: { ...font.baseValues },
      choicesFontsName,
      sliderFontName,
    });
    dispatch(push('/customize'));
    request(GRAPHQL_API, getSelectedCount('Step', font.steps[0].id))
      .then(data => request(GRAPHQL_API, updateSelectedCount('Step', font.steps[0].id, data.Step.selected + 1)))
      .catch(error => console.log(error));
  });
  console.log('===============END SELECT FONT===============');  
};

export const defineNeed = need => (dispatch) => {
  if (need !== 'logo') {
    dispatch(storeChosenWord(DEFAULT_UI_WORD));
  }
  dispatch({
    type: DEFINE_NEED,
    need,
  });
  dispatch(loadPresets());
};

const updateStepValues = (step, font) => (dispatch, getState) => {

  console.log('========updateStepValues===========');
  const {
    choicesFontsName,
    currentPreset,
    currentParams,
    stepBaseValues,
    choicesMade,
    sliderFontName,
  } = getState().font;
  console.log(choicesFontsName);
  
  const { fonts } = getState().createdFonts;
  console.log(fonts);
  const curFontName = font || getState().font.fontName;
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
    console.log(fonts[choicesFontsName[index]]);
    fonts[choicesFontsName[index]].changeParams(
      { ...stepBaseValues, ...currentParams, ...stepChoices }
    );
  });
  fonts[sliderFontName].changeParams({ ...stepBaseValues, ...currentParams });
  if (fonts[curFontName].changeParams) {
    fonts[curFontName].changeParams({ ...stepBaseValues, ...currentParams });
  }
  request(GRAPHQL_API, getSelectedCount('Step', currentPreset.steps[stepToUpdate - 1].id))
      .then(data => request(GRAPHQL_API, updateSelectedCount('Step', currentPreset.steps[stepToUpdate - 1].id, data.Step.selected + 1)))
      .catch(error => console.log(error));
  dispatch({
    type: UPDATE_VALUES,
    fontName: curFontName,
    choicesFontsName,
    sliderFontName,
  });
  console.log('====================================');
};

const updateFont = () => (dispatch, getState) => {
  const {
    fontName,
    currentParams,
    choicesFontsName,
    stepBaseValues,
    sliderFontName,
  } = getState().font;
  const { fonts } = getState().createdFonts;
  fonts[fontName].changeParams({ ...stepBaseValues, ...currentParams });
  fonts[sliderFontName].changeParams({ ...stepBaseValues, ...currentParams });
  dispatch({
    type: UPDATE_VALUES,
    fontName,
    choicesFontsName,
    sliderFontName,
  });
};

export const goToStep = (step, isSpecimen) => (dispatch, getState) => {
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
      if (isSpecimen) {
        dispatch(push('/customize'));
      }
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
  dispatch(goToStep((step += 1)));
  request(GRAPHQL_API, getSpecialChoiceSelectedCount('No choice'))
  .then(data => request(GRAPHQL_API, updateSelectedCount('Choice', data.allChoices[0].id, data.allChoices[0].selected + 1)))
  .catch(error => console.log(error));
};

export const stepBack = () => (dispatch, getState) => {
  let { step } = getState().font;
  dispatch(goToStep((step -= 1)));
};

export const selectChoice = choice => (dispatch, getState) => {
  const { fontName, choicesMade, currentPreset } = getState().font;
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
    fontName,
    currentParams,
    choicesMade,
  });
  dispatch(goToStep((step += 1)));
  if (choice.name === 'custom') {
    request(GRAPHQL_API, getSpecialChoiceSelectedCount('custom'))
      .then(data => request(GRAPHQL_API, updateSelectedCount('Choice', data.allChoices[0].id, data.allChoices[0].selected + 1)))
      .catch(error => console.log(error));
  } else {
    request(GRAPHQL_API, getSelectedCount('Choice', choice.id))
      .then(data => request(GRAPHQL_API, updateSelectedCount('Choice', choice.id, data.Choice.selected + 1)))
      .catch(error => console.log(error));
  }
};

export const finishEditing = () => (dispatch, getState) => {
  const { choicesMade, currentPreset, step } = getState().font;
  const stepLength = currentPreset.steps.length;
  for (let index = step; index < stepLength + 1; index += 1) {
    if (!choicesMade[index]) {
      choicesMade[index] = {};
      choicesMade[index].name = 'No choice';
    }
  }
  request(GRAPHQL_API, getSpecialChoiceSelectedCount('No choice'))
  .then(data => request(GRAPHQL_API, updateSelectedCount('Choice', data.allChoices[0].id, data.allChoices[0].selected + ((stepLength + 1) - step))))
  .catch(error => console.log(error));
  dispatch(updateFont());
  dispatch(push('/specimen'));
  dispatch({
    type: FINISH_EDITING,
    step: stepLength,
    choicesMade,
  });
};

export const download = () => (dispatch, getState) => {
  const { fontName } = getState().font;
  const { fonts } = getState().createdFonts;
  fonts[fontName].getArrayBuffer().then((data) => {
    const blob = new Blob([data], { type: 'application/x-font-opentype' });
    saveAs(blob, `${fontName}.otf`);
  });
};

export const updateSliderFont = newParams => (dispatch, getState) => {
  const { sliderFontName } = getState().font;
  const { fonts } = getState().createdFonts;
  fonts[sliderFontName].changeParam(newParams.name, parseFloat(newParams.value));
};

export const resetSliderFont = () => (dispatch, getState) => {
  const { currentParams, stepBaseValues, sliderFontName } = getState().font;
  const { fonts } = getState().createdFonts;
  fonts[sliderFontName].changeParams({ ...stepBaseValues, ...currentParams });
};

export const reloadFonts = () => (dispatch, getState) => {
  dispatch(setUnstable());

  const { currentPreset, currentParams, baseValues, step } = getState().font;
  const { fonts } = getState().createdFonts;
  let currentStep = step;
  // create userFont
  prototypoFontFactory
    .createFont(`${currentPreset.preset}${currentPreset.variant}`, templateNames[templates[currentPreset.template]])
    .then((createdFont) => {
      dispatch(storeCreatedFont(createdFont, `${currentPreset.preset}${currentPreset.variant}`));
      createdFont.changeParams({ ...baseValues, ...currentParams });
    });
  // create choiceFonts
  const choicesFontsName = [];
  let maxStep = 0;
  currentPreset.steps.forEach((s) => {
    if (s.choices.length > maxStep) {
      maxStep = s.choices.length;
    }
  });
  const promiseArray = [];
  for (let i = 0; i < maxStep; i += 1) {
    promiseArray.push(
      new Promise((resolve) => {
        prototypoFontFactory
          .createFont(`choiceFont${i}`, templateNames[templates[currentPreset.template]])
          .then((createdFont) => {
            if (!currentPreset.steps[currentStep - 1]) {
              currentStep = currentPreset.steps.length - 1;
            }
            if (currentPreset.steps[currentStep - 1].choices[i]) {
              createdFont.changeParams({
                ...baseValues,
                ...currentParams,
                ...currentPreset.steps[currentStep - 1].choices[i].values,
              });
              dispatch(storeCreatedFont(createdFont, `choiceFont${i}`));
              choicesFontsName[i] = `choiceFont${i}`;
            }
            resolve(true);
          });
      }),
    );
  }
  let sliderFontName = '';
  promiseArray.push(
      new Promise((resolve) => {
        prototypoFontFactory
          .createFont('sliderFont', templateNames[templates[currentPreset.template]])
          .then((createdFont) => {
            createdFont.changeParams({
              ...baseValues,
              ...currentParams,
            });
            dispatch(storeCreatedFont(createdFont, 'sliderFont'));
            sliderFontName = 'sliderFont';
            resolve(true);
          });
      }),
    );
  Promise.all(promiseArray).then(() => {
    dispatch({
      type: RELOAD_FONTS,
      choicesFontsName,
      currentPreset,
      fontName: `${currentPreset.preset}${currentPreset.variant}`,
      sliderFontName,
      step: currentStep,
    });
    dispatch(updateStepValues(currentStep, `${currentPreset.preset}${currentPreset.variant}`));
    dispatch(setStable());
    dispatch(push('/start'));
  });
};
