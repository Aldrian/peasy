// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { importPresets } from '../../data/font';
import './App.css';

import TemplateChoice from '../templateChoice/';
import ParamChoice from '../paramChoice/';
import FinalView from '../finalView/';

const context = require.context('../../data/presets', true, /^(.*\.(json$))[^.]*$/igm);
const presets = {};


class App extends React.Component {
  constructor(props) {
    context.keys().forEach((filename) => { presets[filename] = context(filename); });
    props.importPresets(presets);
    super(props);
  }
  render() {
    return (
      <main className="App">
        <Switch>
          <Route exact path="/" render={props => <TemplateChoice {...props} />} />
          <Route path="/template/:template/:step" render={() => <ParamChoice />} />
          <Route exact path="/final/:template/:step" component={FinalView} />
        </Switch>
      </main>
    );
  }
}

App.propTypes = {
  importPresets: PropTypes.func.isRequired,
};
const mapDispatchToProps = dispatch => bindActionCreators({ importPresets }, dispatch);
export default connect(null, mapDispatchToProps)(App);
