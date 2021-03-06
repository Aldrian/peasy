// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { storeExportType } from '../../data/user';
import { ExportType, ExportToPrototypo } from '../../components/exportType/';
import Button from '../../components/button/';

import './ExportTypes.css';


const choices = [
  {
    type: 'download',
    title: 'Download your font',
    price: 15,
    paymentDescription: 'One time payment',
    direct: true,
  },
  {
    type: 'host',
    title: 'Host as a responsive font',
    description: (<span>
      <p>
        Les avantages d&apos;utiliser une font en responsive et pourquoi c&apos;est cool
      </p>
      <p>
        Aussi dire qu&apos;on peut juste la mettre sur un cdn rapide et trop bien
      </p>
    </span>),
    price: 99,
    paymentDescription: 'Billed annualy',
  },
  {
    type: 'prototypo',
    title: 'Refine it with Prototypo',
    component: <ExportToPrototypo />,
    description: (<span>
      <p>
        Prototypo c&apos;est super cool
      </p>
      <p>
        On peut tout modifier a fond {'<Demo>'}
      </p>
    </span>),
    price: 99,
    paymentDescription: 'Billed annually',
  },
];

class ExportTypes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chosenType: undefined,
    };
  }
  selectChoice(type) {
    this.setState({ chosenType: type });
    if (type.type === 'download') {
      this.props.storeExportType(type.type);
    }
  }
  removeChoice() {
    this.setState({ chosenType: undefined });
  }
  render() {
    return (
      <div
        className={`ExportTypes ${
          this.state.chosenType && !this.state.chosenType.direct
            ? 'expanded'
            : ''
        }`}
      >
        <Button
          className="back"
          label="Back"
          mode="isBack"
          onClick={() => this.props.goBack()}
        />
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <h1>
                {this.state.chosenType
                  ? this.state.chosenType.title
                  : 'What do you want to do with your font?'}
              </h1>
            </div>
          </div>
          <div className="needs row">
            {this.state.chosenType && !this.state.chosenType.direct ? (
              <div className="col-sm-12">
                <ExportType
                  choice={this.state.chosenType}
                  expanded
                  selectChoice={() => this.selectChoice(this.state.chosenType)}
                  removeChoice={() => this.removeChoice()}
                />
              </div>
            ) : (
              choices.map(choice => (
                <div className="col-sm-12 col-md-4" key={choice.title}>
                  <ExportType
                    choice={choice}                    
                    selectChoice={() => this.selectChoice(choice)}
                    removeChoice={() => this.removeChoice()}
                    alreadyBought={this.props.alreadyBought}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({ alreadyBought: state.font.alreadyBought });

const mapDispatchToProps = dispatch => bindActionCreators({ storeExportType, goBack: () => push('/specimen') }, dispatch);

ExportTypes.propTypes = {
  goBack: PropTypes.func.isRequired,
  storeExportType: PropTypes.func.isRequired,
  alreadyBought: PropTypes.bool.isRequired,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ExportTypes));
