// @flow
import React from 'react';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import './SpecimenView.css';
import StepList from '../stepList/';
import Button from '../../components/button/';
import { storeEmail } from '../../data/user';

const isEmail = string => new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(string);

class SpecimenView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(event) {
    this.setState({ email: event.target.value });
  }
  handleSubmit(event) {
    if (isEmail(this.state.email)) {
      this.props.storeEmail(this.state.email);
    }
    event.preventDefault();
  }
  render() {
    return (
      <div className="SpecimenView">
        <Button className="back" label="Back" onClick={() => this.props.goBack()} />
        <h3>Hooray !</h3>
        <h3 className="subtitle"> You have created the perfect bespoke font for your project</h3>
        <div className="specimen" style={{ fontFamily: this.props.fontName }}>
          <div className="left">
            <h2>Hamburgefonstiv - Abc 123</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat.
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
          </div>
          <div className="right">
            <p>0123456789</p>
            <p>abcdefghijklmnopqrstuvwxyz</p>
            <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p>The quick brown fox jumps over the lazy dog</p>
            <p>Buvez de ce whisky que le patron juge fameux</p>
          </div>
          <StepList />
        </div>
        <form onSubmit={this.handleSubmit}>
          <input type="email" placeholder="your email" name="email" onChange={this.handleChange} />
          <button type="submit">Download</button>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  fontName: state.font.currentPreset.preset + state.font.currentPreset.variant,
  step: state.font.step,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  goBack: () => push('/customize'),
  storeEmail,
}, dispatch);

SpecimenView.propTypes = {
  storeEmail: PropTypes.func.isRequired,
  goBack: PropTypes.func.isRequired,
  fontName: PropTypes.string,
};

SpecimenView.defaultProps = {
  fontName: 'ptypo',
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SpecimenView));
