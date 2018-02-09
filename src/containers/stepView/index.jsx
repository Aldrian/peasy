// @flow
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import FlipMove from 'react-flip-move';
import { Shortcuts } from 'react-shortcuts';
import { stepForward, stepBack, selectChoice, updateSliderFont, finishEditing } from '../../data/font';
import Choice from '../../components/choice/';
import WordView from '../wordView/';
import Sliders from '../sliders/';
import Button from '../../components/button/';
import './StepView.css';

const isMostSelected = (choices) => {
  let most = choices[0].id;
  let value = 0;
  choices.forEach((choice) => {
    if (choice.selected > value) {
      value = choice.selected;
      most = choice.id;
    }
  });
  return value > 0 && most;
};

class StepView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      choice: props.choicesMade[props.step],
      isInputFocused: false,
    };

    this.markChoiceActive = (choice) => {
      this.setState({ choice });
    };

    this.onUpdate = (updatedParam) => {
      const currentParams = this.state.choice;
      this.props.updateSliderFont(updatedParam);
      currentParams.values[updatedParam.name] = parseFloat(updatedParam.value);
      this.setState({ choice: currentParams });
      return true;
    };
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.handleShortcuts = this.handleShortcuts.bind(this);
  }  
  componentWillMount() {
    this.setChoiceSelected(this.props);
  }
  componentDidMount() {
    this.stepViewWrapper.focus();
  }
  componentWillReceiveProps(newProps) {
    this.setChoiceSelected(newProps);
    console.log(newProps)
  }
  onFocus() {
    this.setState({ isInputFocused: true });
  }
  onBlur() {
    this.setState({ isInputFocused: false });
  }
  setChoiceSelected(props) {
    let choice = {};
    if (props.choicesMade[props.step]) {
      if (props.choicesMade[props.step].name === 'Custom') {
        choice = {
          name: props.choicesMade[props.step].name,
          values: { ...props.choicesMade[props.step] },
        };
        delete choice.values.name;
      } else {
        choice = props.stepValues.choices.find(c => c.name === props.choicesMade[props.step].name);
      }
    }
    this.setState({
      choice,
      mostSelected: isMostSelected(props.stepValues.choices),
    });
  }
  handleShortcuts(action, event) {
    if (!this.state.isInputFocused) {
      switch (action) {
        case 'CHOICE_PREVIOUS':
          if (this.state.choice) {
            if (this.state.choice.name === 'Custom') {
              this.setState({ choice: { name: 'No choice', values: {} } });
              break;
            }
            
            const choiceIndex = this.props.stepValues.choices.findIndex(
              choice => choice.name === this.state.choice.name);
            if (this.state.choice.name === 'No choice') {
              this.setState({
                choice: this.props.stepValues.choices[this.props.stepValues.choices.length - 1]
              });
              break;
            }
            if (choiceIndex === 0) {
              this.setState({ choice: { name: 'No choice', values: {} } });
              break;
            } else {
              this.setState({ choice: this.props.stepValues.choices[choiceIndex - 1] });
              break;
            }
          } else {
            this.setState({ choice: { name: 'No choice', values: {} } });
            break;
          }
        case 'CHOICE_NEXT':
          if (this.state.choice) {
            if (this.state.choice.name === 'Custom') {
              this.setState({ choice: this.props.stepValues.choices[0] });
              break;
            }
            if (this.state.choice.name === 'No choice') {
              this.setState({ choice: this.props.stepValues.choices[0] });
              break;
            }
            const choiceIndex = this.props.stepValues.choices.findIndex(
              choice => choice.name === this.state.choice.name);
            if (choiceIndex + 1 >= this.props.stepValues.choices.length) {
              this.setState({ choice: { name: 'No choice', values: {} } });
              break;
            } else {
              this.setState({ choice: this.props.stepValues.choices[choiceIndex + 1] });
              break;
            }
          } else {
            this.setState({ choice: this.props.stepValues.choices[0] });
            break;
          }
        case 'CHOICE_CUSTOM':
          this.markChoiceActive({ name: 'Custom', values: {} });
          break;
        case 'CHOICE_SELECT':
          this.props.selectChoice(this.state.choice);
          break;
        case 'STEP_BACK':
          this.props.stepBack();
          break;
        case 'STEP_FORWARD':
          this.props.stepForward();
          break;
        case 'FINISH_FONT':
          this.props.finishEditing();
          break;
        default:
          break;
      }
    }
  }
  render() {
    return (
      <Shortcuts
        name="CHOICES"
        handler={this.handleShortcuts}
      >
        <div className="StepView" ref={(c) => { this.stepViewWrapper = c; }} tabIndex="-1">
          <Button className="back" label="" mode="isBack" onClick={this.props.stepBack} />
          <div className="container">
            <h3 className="currentState">Current state</h3>
            <WordView
              word={this.props.chosenWord}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              selected={this.state.choice && this.state.choice.name === 'No choice'}
              onClick={() => this.markChoiceActive({ name: 'No choice', values: {} })}
              onDoubleClick={() => this.props.selectChoice({ name: 'No choice', values: {} })}
              fontSize={this.props.fontSize}
            />
            <Button className="finish" label="I'm done" onClick={this.props.finishEditing} />
            <div className="description">
              <h3>
                {this.props.stepValues.description}:
              </h3>
            </div>
            <div className="choices">
              <FlipMove
                duration={200}
                easing="ease"
                appearAnimation={this.props.step === 1 ? 'accordionHorizontal' : undefined}
                enterAnimation={this.props.step > 1 ? 'accordionHorizontal' : undefined}
                leaveAnimation="accordionHorizontal"
                staggerDurationBy="20"
                staggerDelayBy="40"
                maintainContainerHeight
              >
                {this.props.stepValues.choices.map((choice, index) =>
                  (<Choice
                    choice={choice}
                    key={`${choice.name}${choice.id}`}
                    markChoiceActive={this.markChoiceActive}
                    selectChoice={this.props.selectChoice}
                    index={index}
                    selected={this.state.choice === choice}
                    text={this.props.chosenWord}
                    mostSelected={this.state.mostSelected === choice.id}
                    fontSize={this.props.fontSize}
                  />),
                )}
              </FlipMove>
              <div
                className={`choiceMore ${this.state.choice && this.state.choice.name === 'Custom'
                  ? 'selected'
                  : ''}`}
                role="option"
                aria-checked="false"
                aria-selected="false"
                tabIndex={0}
                key={`choiceCustom`}
                onDoubleClick={() => this.props.selectChoice(this.state.choice)}
              >
                {this.state.choice && this.state.choice.name === 'Custom'
                  ? this.props.chosenWord
                  : ''}
              </div>
              {this.state.choice && this.state.choice.name === 'Custom'
                ? <Sliders onUpdate={this.onUpdate} />
                : false}
            </div>
            <div className="actions">
              <span className="previousStep">
                <Button
                  className="hollow"
                  mode="isConfigure"
                  label={this.state.choice && this.state.choice.name === 'Custom'
                  ? 'Remove custom choice'
                  : 'More accuracy'}
                  onClick={() => this.markChoiceActive({ name: 'Custom', values: {} })}
                />
              </span>
              <span className="nextStep">
                <Button
                  className="hollow left"
                  label="Skip"
                  onClick={this.props.stepForward}
                />
                <Button
                  className=""
                  label="Next step"
                  onClick={() => this.props.selectChoice(this.state.choice)}
                />
              </span>
            </div>
          </div>        
        </div>
      </Shortcuts>
    );
  }
}

const mapStateToProps = state => ({
  stepValues: state.font.currentPreset.steps[state.font.step - 1],
  step: state.font.step,
  choicesMade: state.font.choicesMade,
  chosenWord: state.user.chosenWord,
  fontSize: state.user.fontSize,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      stepForward,
      stepBack,
      selectChoice,
      updateSliderFont,
      finishEditing,
    },
    dispatch,
  );

StepView.propTypes = {
  fontSize: PropTypes.number.isRequired,
  stepForward: PropTypes.func.isRequired,
  stepBack: PropTypes.func.isRequired,
  selectChoice: PropTypes.func.isRequired,
  finishEditing: PropTypes.func.isRequired,
  updateSliderFont: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired,
  choicesMade: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  stepValues: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
      }),
    ),
  }).isRequired,
  chosenWord: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(StepView);
