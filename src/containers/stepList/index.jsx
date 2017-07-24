// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Step from '../../components/step/';
import './StepList.css';

const StepList = props => (
  <div className="StepList">
    <Link key="template" to="/"><div>Template choice</div></Link>
    {props.steps.map((step, index) => (
      <Step index={index} title={step.name} template={props.template} key={step.name} />
    ))}
  </div>
);


StepList.propTypes = {
  template: PropTypes.string.isRequired,
};

StepList.defaultProps = {
  template: 'elzevir',
};

const mapStateToProps = state => ({
  template: state.routing.location.pathname.split('/')[2],
});

export default connect(mapStateToProps, null)(StepList);

